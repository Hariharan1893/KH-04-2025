from agents.models.mistral import client as mc
from agents.models.gemini import client as gc


prompt_1 = r"""
You are an expert resume scoring engine. Your task is to evaluate a candidate's resume against a job description by calculating scores for multiple categories and providing a detailed explanation (reason) for each score to help mitigate bias. You are given two sets of inputs:

1. **Resume Data (JSON):**  
This JSON contains extracted resume information, including sections like personal_information, education, work_experience, projects, skills, certifications, awards, languages, and others.

2. **Job Description Data (JSON):**  
This JSON includes:  
   - "jd": The job description text.  
   - "required_skills": A list of required technical skills.  
   - "required_experience": Details about the required experience.  
   - "parsing_weightage": An object with dynamic keys representing categories (e.g., "Education", "Experience", "Technical Skills", etc.) and their respective weight percentages that sum to 100.

Your tasks are as follows:

- For each category present in the "parsing_weightage" object, evaluate the candidate's resume:
  - **Assign a score:** Based solely on the provided resume data and job description criteria, assign a score (from 0 up to the maximum weight for that category). If the resume data for a category is missing or insufficient, assign a lower score (or 0 if completely absent).
  - **Provide a reason:** For each category score, include a clear explanation for the score that addresses potential biases and the quality or completeness of the data.
  
- Compute each category's weighted contribution and sum these to get a final total score out of 100.
- Also provide an overall reason for the final total score.

**Edge Cases:**  
- If details are ambiguous or missing, score conservatively without assuming any information.  
- Do not hallucinate or add any extra details beyond the provided input.

**Output Format:**  
Return your final result strictly as a JSON object with the following keys (adjust for each dynamic category):
- `<category>_score`: The score for that category.
- `<category>_reason`: The explanation for the score.
- `total_score`: The final computed score out of 100.
- `total_reason`: An overall explanation of how the total score was determined.

Do not include any additional text or commentary outside the JSON output.

Now, using the inputs below, calculate the scores:

**Resume Data (JSON):**
<INSERT RESUME JSON HERE>

"""

prompt_2 = r"""

**Job Description Data (JSON):**
<INSERT RESUME JSON HERE>
"""

prompt_3 = r"""
Return your final scoring result as a JSON object.
{
  <category>_score
  <category>_reason
  total_score
  total_reason
}
"""


def scoring_agent(resume_json, jd_json):
    response = gc.models.generate_content(
        model="gemini-2.0-flash",
        config={
            'temperature': 0,
            'seed': 145
        },
        contents=str(prompt_1) + str(resume_json) +
        str(prompt_2) + str(jd_json) + str(prompt_3),
    )

    return response.text
