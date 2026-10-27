"""Use the document skill PNG renderer with a PDF already exported by Word.
Windows bundle has no LibreOffice. No desktop LibreOffice or managed code changed.
"""
import importlib.util, os, sys, tempfile
from pathlib import Path
from pypdf import PdfReader
from PIL import Image,ImageDraw
skill=Path('C:/Users/AD/.codex/plugins/cache/openai-primary-runtime/documents/26.1025.11240/skills/documents')
os.environ['PATH']='C:/Users/AD/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin'+os.pathsep+os.environ['PATH']
spec=importlib.util.spec_from_file_location('docx_renderer',skill/'render_docx.py')
renderer=importlib.util.module_from_spec(spec);spec.loader.exec_module(renderer)
pdf=Path(sys.argv[1]).resolve();out=Path(sys.argv[2]).resolve()
task_temp=(Path(__file__).parent/'render-temp').resolve()
assert task_temp.is_relative_to(Path(__file__).parent.resolve())
task_temp.mkdir(exist_ok=True)
tempfile.tempdir=str(task_temp)
renderer.convert_to_pdf=lambda *a,**kw:(str(pdf),'PDF exported using Microsoft Word 16 document conversion API.')
paths=renderer.rasterize(str(pdf),str(out),110,False,False)
for start in range(0,len(paths),6):
 sheet=Image.new('RGB',(3*460,2*670),'#d5d5d5');d=ImageDraw.Draw(sheet)
 for j,path in enumerate(paths[start:start+6]):
  im=Image.open(path);im.thumbnail((448,634));x=(j%3)*460+6;y=(j//3)*670+27;sheet.paste(im,(x,y));d.text((x,y-20),str(start+j+1),fill='black')
 sheet.save(out/f'contact-{start//6+1}.png')
reader=PdfReader(pdf)
for i,page in enumerate(reader.pages):
 s=page.extract_text();print(str(i+1)+': '+s[:105].replace('\n',' / ')+' ... '+s[-100:].replace('\n',' / '))
print('Pages:',len(paths))
