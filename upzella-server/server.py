from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
import requests
import json
import ast
import io
import cv2

from gtts import gTTS
import speech_recognition as sr
import pyttsx3
from pydub import AudioSegment

from utils.utils import parse_pdf, format_response

from agents.ResumeParserAgent import parser_agent
from agents.ResumeScoringAgent import scoring_agent
from agents.InterviewAgents import ask_agent
from agents.InterviewScoringAgents import score_response, get_category

app = Flask(__name__)
CORS(app)


@app.route('/parseResume', methods=['POST', 'GET'])
def parse_resume():
    data = request.get_json()
    if not data or 'resumeUrl' not in data:
        return jsonify({'error': 'Missing resumeUrl parameter'}), 400
    resume_url = data['resumeUrl']['publicUrl']
    jd_data = data['jobDescription']

    try:
        response = requests.get(resume_url)
        response.raise_for_status()

        extracted_text = parse_pdf(response)

        parsed_resume_data = parser_agent(extracted_text)

        parsed_resume_data = json.loads(format_response(parsed_resume_data))

        scored_data = scoring_agent(parsed_resume_data, jd_data)

        cleaned_scored_data = json.loads(format_response(scored_data))

        return jsonify({'parsedText': parsed_resume_data, 'scoredData': cleaned_scored_data}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route("/get-questions", methods=["POST"])
def get_questions():
    data = request.get_json()
    if not data or "jd" not in data or "parsed_resume_data" not in data:
        return jsonify({"error": "Missing 'jd' or 'parsed_resume_data' parameter."}), 400

    jd = data.get("jd")
    parsed_resume = data.get("parsed_resume_data")

    # Agent Zella (Technical) - up to 3 unique questions.
    zella_instruction = "Please generate up to 3 unique technical questions to evaluate the candidate's technical expertise."
    zella_response = ask_agent(
        "Zella", "technical", jd, parsed_resume, zella_instruction)
    zella_questions = ast.literal_eval(format_response(zella_response))

    # Agent Haana (Non-Technical) - 2 unique questions.
    haana_instruction = "Please generate 2 unique non-technical questions to assess the candidate's soft skills and general aptitude."
    haana_response = ask_agent(
        "Haana", "non-technical", jd, parsed_resume, haana_instruction)
    haana_questions = ast.literal_eval(format_response(haana_response))

    # Agent Kai (HR) - 1 question.
    kai_instruction = "Please generate 2 question that evaluates the candidate's cultural fit and HR qualities."
    kai_response = ask_agent("Kai", "HR", jd, parsed_resume, kai_instruction)
    kai_questions = ast.literal_eval(format_response(kai_response))

    result = {
        "zella_questions": zella_questions,
        "haana_questions": haana_questions,
        "kai_questions": kai_questions,
    }
    return jsonify(result)


@app.route("/generate-audio", methods=["POST"])
def generate_audio():
    data = request.json
    text = data.get("text", "Hello, this is a default text.")

    tts = gTTS(text=text, lang='en')
    audio_buffer = io.BytesIO()
    tts.write_to_fp(audio_buffer)
    audio_buffer.seek(0)

    return send_file(audio_buffer, mimetype="audio/mpeg", as_attachment=False)


@app.route('/score-interview-response', methods=['POST', 'GET'])
def score_interview_response():
    data = request.get_json()

    if 'messages' not in data or not isinstance(data['messages'], list):
        return jsonify({"error": "Invalid request format"}), 400

    messages = data['messages']
    results = []
    total_score = 0
    max_possible_score = 10 * \
        len([m for m in messages if m['sender'] == 'User'])

    for i in range(len(messages)):
        if messages[i]['sender'] == 'User' and i > 0 and messages[i-1]['sender'] == 'Bot':
            question = messages[i-1]['text']
            answer = messages[i]['text']
            agent = messages[i-1].get('agent', None)
            category = get_category(agent)

            evaluation = json.loads(format_response(
                score_response(question, answer, category)))
            total_score += evaluation["score"]
            results.append({
                "question": question,
                "answer": answer,
                "category": category,
                "score": evaluation["score"],
                "reasoning": evaluation["reasoning"]
            })

    if total_score == 0:
        overall_reasoning = "No valid responses were provided. Consider providing detailed answers for a better score."
    elif total_score / max_possible_score < 0.3:
        overall_reasoning = "Responses lacked depth, clarity, or relevance. Try to provide more detailed and structured answers."
    elif total_score / max_possible_score < 0.6:
        overall_reasoning = "Some answers were acceptable, but improvements in clarity and detail are needed."
    elif total_score / max_possible_score < 0.8:
        overall_reasoning = "Good responses overall, but minor improvements in depth and explanation can enhance your performance."
    else:
        overall_reasoning = "Excellent responses! Demonstrated strong understanding and clear communication."

    return jsonify({"results": results, "total_score": total_score, "overall_reasoning": overall_reasoning, 'max_possible_score': max_possible_score})


camera = cv2.VideoCapture(0)


def generate_frames():
    while True:
        success, frame = camera.read()
        if not success:
            break
        else:
            _, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')


@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/capture_frame', methods=['GET'])
def capture_frame():
    global stored_face_encoding
    _, frame = camera.read()

    _, buffer = cv2.imencode('.jpg', frame)
    return Response(buffer.tobytes(), content_type="image/jpeg")


recognizer = sr.Recognizer()
engine = pyttsx3.init()


@app.route("/speech-to-text", methods=["POST"])
def speech_to_text():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    audio_bytes = file.read()
    audio = AudioSegment.from_file(io.BytesIO(audio_bytes), format="webm")
    wav_io = io.BytesIO()
    audio.export(wav_io, format="wav")
    wav_io.seek(0)

    with sr.AudioFile(wav_io) as source:
        audio_data = recognizer.record(source)
        try:
            text = recognizer.recognize_google(audio_data)
            return jsonify({"transcription": text})
        except sr.UnknownValueError:
            return jsonify({"error": "Could not understand audio"}), 400
        except sr.RequestError:
            return jsonify({"error": "Speech Recognition service unavailable"}), 500


if __name__ == '__main__':
    app.run(port=5000, debug=True)
