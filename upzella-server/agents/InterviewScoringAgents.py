from agents.models.gemini import client as gc


def get_category(agent):
    if agent == "Zella":
        return "Technical"
    elif agent == "Haana":
        return "Non-Technical"
    elif agent == "Kai":
        return "HR & Culture Fit"
    return "Unknown"


def score_response(question, answer, category):
    prompt = f"""
    Evaluate the following answer to a {category.lower()} interview question based on clarity, depth, and relevance. 
    Assign a score from 1 to 10 and provide reasoning.
    
    Question: {question}
    Answer: {answer}
    
    Response format (JSON):
    {{"score": <numeric_score>, "reasoning": "<text_reasoning>"}}
    """

    response = gc.models.generate_content(
        model="gemini-2.0-flash",
        config={
              'temperature': 0,
            'seed': 145
        },
        contents=str(prompt)
    )

    return response.text
