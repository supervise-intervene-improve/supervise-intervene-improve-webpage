"""Preview the static build under a repository subpath, including video byte ranges."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit
import argparse
import re

class ProjectHandler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map,
                      ".webp": "image/webp", ".svg": "image/svg+xml",
                      ".js": "application/javascript", ".css": "text/css",
                      ".json": "application/json", ".pdf": "application/pdf",
                      ".mp4": "video/mp4"}

    def __init__(self, *args, directory, base_path, **kwargs):
        self.project_base = base_path
        super().__init__(*args, directory=directory, **kwargs)

    def serve_project(self, head=False):
        path = urlsplit(self.path).path
        if path in {'/', self.project_base.rstrip('/')}:
            self.send_response(302)
            self.send_header('Location', self.project_base)
            self.send_header('Content-Length', '0')
            self.end_headers()
            return
        if not path.startswith(self.project_base):
            self.send_error(404, 'Outside the configured repository subpath')
            return
        self.path = '/' + self.path[len(self.project_base):]
        file = Path(self.translate_path(self.path))
        if file.suffix.lower() != '.mp4' or not file.is_file():
            return super().do_HEAD() if head else super().do_GET()
        size = file.stat().st_size
        start, end = 0, size - 1
        requested = self.headers.get('Range')
        if requested:
            match = re.fullmatch(r'bytes=(\d*)-(\d*)', requested)
            if not match or not any(match.groups()):
                self.send_error(400, 'A single byte range is required')
                return
            if match[1]:
                start = int(match[1])
                end = min(int(match[2]), size - 1) if match[2] else size - 1
            elif int(match[2]) > 0:
                start = max(0, size - int(match[2]))
            else:
                start = size
            if start > end:
                self.send_response(416)
                self.send_header('Content-Range', f'bytes */{size}')
                self.send_header('Content-Length', '0')
                self.end_headers()
                return
        self.send_response(206 if requested else 200)
        self.send_header('Content-Type', 'video/mp4')
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Length', str(end - start + 1))
        self.send_header('Last-Modified', self.date_time_string(file.stat().st_mtime))
        if requested:
            self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.end_headers()
        if head:
            return
        try:
            with file.open('rb') as source:
                source.seek(start)
                remaining = end - start + 1
                while remaining:
                    block = source.read(min(262144, remaining))
                    if not block:
                        break
                    self.wfile.write(block)
                    remaining -= len(block)
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            pass

    def do_GET(self):
        self.serve_project()

    def do_HEAD(self):
        self.serve_project(head=True)

    def log_message(self, format, *args):
        if args and str(args[1] if len(args) > 1 else '') not in {'200', '206', '302', '304'}:
            super().log_message(format, *args)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--directory', default='dist')
    parser.add_argument('--base-path', default='/supervise-intervene-improve-webpage/')
    parser.add_argument('--port', type=int, default=8001)
    args = parser.parse_args()
    directory = Path(args.directory).resolve()
    if not (directory / 'index.html').is_file():
        parser.error('Build the website before starting its preview.')
    base = '/' + args.base_path.strip('/') + '/'
    if base == '//':
        parser.error('Use a nonempty project subpath.')
    def handler(*positional, **kwargs):
        return ProjectHandler(*positional, directory=str(directory), base_path=base, **kwargs)
    server = ThreadingHTTPServer(('127.0.0.1', args.port), handler)
    print(f'Preview: http://127.0.0.1:{args.port}{base}', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

if __name__ == '__main__':
    main()
