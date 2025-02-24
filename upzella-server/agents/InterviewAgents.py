from agents.models.gemini import client as gc


def ask_agent(agent_name: str, role: str, jd: str, parsed_resume: str, prompt_instruction: str) -> str:
    """
    Constructs a prompt and calls Gemini 2.0 Flash to generate a response.
    """
    prompt = f"""
You are {agent_name}, an expert in {role} questions.
Based on the following job description and parsed resume data, generate questions as instructed.

Job Description:
{jd}

Parsed Resume Data:
{parsed_resume}

{prompt_instruction}

output a array of questions.

- don't include any empty strings in the array.
- don't add any extra text in the output.
- only give the questions.

"""
    response = gc.models.generate_content(
        model="gemini-2.0-flash",
        config={
            'temperature': 0,
            'seed': 145
        },
        contents=prompt,
    )
    return response.text.strip()
