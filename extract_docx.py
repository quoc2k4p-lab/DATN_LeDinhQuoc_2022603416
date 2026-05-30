import sys
import zipfile
import xml.etree.ElementTree as ET

def docx_to_text(docx_path, txt_path):
    try:
        with zipfile.ZipFile(docx_path) as z:
            xml_content = z.read('word/document.xml')
            root = ET.fromstring(xml_content)
            
            # The namespace for Word processing ML
            w_namespace = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
            
            paragraphs = []
            # Find all paragraph elements
            for paragraph in root.iter(w_namespace + 'p'):
                texts = []
                # Find all text elements within the paragraph
                for text_elem in paragraph.iter(w_namespace + 't'):
                    if text_elem.text:
                        texts.append(text_elem.text)
                paragraphs.append("".join(texts))
                
            # Write to output file
            with open(txt_path, 'w', encoding='utf-8') as f:
                f.write("\n".join(paragraphs))
        print(f"Successfully converted {docx_path} to {txt_path}")
    except Exception as e:
        print(f"Error converting {docx_path}: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python extract_docx.py <input.docx> <output.txt>")
    else:
        docx_to_text(sys.argv[1], sys.argv[2])
