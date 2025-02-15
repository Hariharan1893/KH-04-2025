from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import re

from utils.utils import parse_pdf

from agents.ResumeParserAgent import parser_agent

app = Flask(__name__)
CORS(app)


@app.route('/parseResume', methods=['POST', 'GET'])
def parse_resume():
    data = request.get_json()
    if not data or 'resumeUrl' not in data:
        return jsonify({'error': 'Missing resumeUrl parameter'}), 400
    resume_url = data['resumeUrl']['publicUrl']

    try:
        response = requests.get(resume_url)
        response.raise_for_status()

        extracted_text = parse_pdf(response)

        parsed_resume_data = parser_agent(extracted_text)

        cleaned_json_string = re.sub(
            r'^```json\s*', '', parsed_resume_data, flags=re.MULTILINE)
        cleaned_json_string = re.sub(
            r'\s*```$', '', cleaned_json_string, flags=re.MULTILINE)

        parsed_resume_data = json.loads(cleaned_json_string)

        return jsonify({'parsedText': parsed_resume_data}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(port=5000, debug=True)
