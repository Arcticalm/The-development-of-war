"""Local Canvas UI review harness. Not packaged with the WeChat game."""
import argparse
import json
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class PreviewHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.split('?')[0] == '/scripts/ui-preview.bundle.js':
            modules = []
            for source in sorted((ROOT / 'src').rglob('*.js')):
                key = source.relative_to(ROOT).as_posix()
                modules.append(json.dumps(key) + ':function(require,module,exports){\n' + source.read_text(encoding='utf-8') + '\n}')
            bundle = 'window.previewModules={' + ',\n'.join(modules) + '};'
            payload = bundle.encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'text/javascript; charset=utf-8')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Content-Length', str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
        else:
            super().do_GET()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8123)
    args = parser.parse_args()
    server = ThreadingHTTPServer(('127.0.0.1', args.port), partial(PreviewHandler, directory=str(ROOT)))
    print(f'Canvas preview: http://127.0.0.1:{args.port}/scripts/ui-preview.html', flush=True)
    server.serve_forever()
