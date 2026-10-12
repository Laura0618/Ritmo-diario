import { ColdTool } from '../components/tools/ColdTool';
import { NsdrTool } from '../components/tools/NsdrTool';
import { SighTool } from '../components/tools/SighTool';

export function HerramientasPage(): JSX.Element {
  return (
    <>
      <div className="section-head">
        <h1>Herramientas guiadas</h1>
        <p className="muted">Úsalas cuando las necesites. Solo hacen falta unos minutos.</p>
      </div>
      <div className="tools">
        <SighTool />
        <NsdrTool />
        <ColdTool />
      </div>
    </>
  );
}
