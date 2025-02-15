import io
import PyPDF2
import re


def parse_pdf(pdf_file):
    pdf_file = io.BytesIO(pdf_file.content)

    reader = PyPDF2.PdfReader(pdf_file)

    page_text = ""

    for _, page in enumerate(reader.pages, start=1):
        page_text += page.extract_text() or ""

        # try:
        #     if '/Annots' in page:
        #         annotations = page['/Annots']

        #         for annot in annotations:
        #             obj = annot.get_object()
        #             if '/A' in obj and '/URI' in obj['/A']:
        #                 url = obj['/A']['/URI']
        #                 page_text += '\n' + url + '\n'
        # except:
        # pass

    return page_text


def format_response(data):
    cleaned_json_string = re.sub(
        r'^```json\s*', '', data, flags=re.MULTILINE)
    cleaned_json_string = re.sub(
        r'\s*```$', '', cleaned_json_string, flags=re.MULTILINE)
    return cleaned_json_string
