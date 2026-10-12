import { Link } from 'react-router-dom';

export function NoEncontradoPage(): JSX.Element {
  return (
    <div className="panel">
      <h1>Esta página no existe</h1>
      <p className="lede">
        Vuelve a <Link to="/">tu plan de hoy</Link>.
      </p>
    </div>
  );
}
