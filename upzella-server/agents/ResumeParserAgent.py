from agents.models.mistral import client as mc
from agents.models.gemini import client as gc

import json

# def parser_agent(extracted_resume_text):
#     chat_response = mc.agents.complete(
#         agent_id="ag:b3a1b704:20250215:untitled-agent:9e6009a5",
#         messages=[
#             {
#                 "role": "user",
#                 "content": str(extracted_resume_text),
#             },
#         ],
#     )
#     return chat_response.choices[0].message.content


prompt = r"""
You are a highly accurate resume parser. Your task is to extract structured information from the given resume text and output the result in a JSON format that strictly follows the schema below. Do not add any extra keys, and do not invent any data that is not present in the resume.

The JSON schema is as follows:

{
    "personal_information": {
        "full_name": "<string>",
    "email": "<string>",
    "phone": "<string>",
    "linkedin_url": "<string>",
    "github_url": "<string>",
    "portfolio_url": "<string>",
    "location": {},         // A dictionary with location details (e.g., city, state, country)
    "others": {}            // Any other key-value pairs for personal info not covered above
  },
  "education": [
    {
        "institution": "<string>",
      "degree": "<string>",
      "major": "<string>",
      "gpa": "<string>",
      "start_date": "<string>",
      "end_date": "<string>"
    }
    // Repeat for each educational entry
  ],
  "work_experience": [
    {
        "company": "<string>",
      "title": "<string>",
      "start_date": "<string>",
      "end_date": "<string>",
      "location": {},         // A dictionary with location details (if available)
      "responsibilities": ["<string>", ...]
    }
    // Repeat for each work experience entry
  ],
  "projects": [
    {
        "name": "<string>",
      "description": ["<string>", ...],
      "start_date": "<string>",
      "end_date": "<string>",
      "technologies": ["<string>", ...]
    }
    // Repeat for each project entry
  ],
  "skills": ["<string>", ...],
  "certifications": [
    {
        "name": "<string>",
      "issuing_organization": "<string>",
      "issue_date": "<string>",
      "expiration_date": "<string>",
      "credential_url": "<string>"
    }
    // Repeat for each certification entry
  ],
  "awards": ["<string>", ...],
  "languages": ["<string>", ...],
  "others": ["<string>", ...]
}

Instructions:
1. Extract the information exactly as it appears in the resume text. If any information is missing, output an empty string, empty list, or empty dictionary, as appropriate.
2. Do not hallucinate or assume details that are not explicitly provided in the resume text.
3. Handle edge cases such as ambiguous dates, incomplete addresses, or inconsistent formatting by leaving the respective field empty rather than guessing.
4. Ensure that the output is valid JSON that exactly matches the schema provided.
5. Only use the keys specified in the schema, and do not add any commentary or additional text outside the JSON output don't add json in the front of the response.

Now, parse the following resume text:

<RESUME TEXT>
"""


def parser_agent(extracted_resume_text):
    response = gc.models.generate_content(
        model="gemini-2.0-flash",
        contents=str(prompt + extracted_resume_text)
    )

    return response.text
