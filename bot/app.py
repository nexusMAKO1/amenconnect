from flask import Flask, jsonify
import os
from routes import bp

app = Flask(__name__)
app.register_blueprint(bp)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "service": "amenbot"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() in ('true', '1')
    app.run(host='0.0.0.0', port=port, debug=debug)
