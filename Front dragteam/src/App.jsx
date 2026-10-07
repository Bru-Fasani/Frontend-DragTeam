import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, ArrowDownUp, CarFront, ChevronDown, CircleHelp, Gauge, Link2, LoaderCircle, RefreshCw, Search, Settings2, Users, Wifi, WifiOff } from 'lucide-react';

const defaultUrl = import.meta.env.VITE_API_URL || 'https://dragteamapi.onrender.com';

function readTeams(payload) {
  if (payload && typeof payload === 'object' && !Array.isArray(payload) && payload.id) return [payload];
  if (Array.isArray(payload)) return payload;
  for (const key of ['teams', 'data', 'items', 'results']) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
}

function getName(team, index) {
  return team.name || team.teamName || team.nome || team.title || `Equipe ${index + 1}`;
}

function getInitials(name) {
  return String(name).split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function TeamDetails({ team }) {
  const section = (title, items, renderItem, empty) => <section className="detail-section"><h3>{title} <span>{items?.length || 0}</span></h3>{items?.length ? <ul>{items.map((item) => <li key={item.id}>{renderItem(item)}</li>)}</ul> : <p>{empty}</p>}</section>;
  return <div className="team-details">
    {section('Pilotos', team.drivers, (driver) => <><strong>{driver.name}</strong>{driver.nickname && <span>“{driver.nickname}”</span>}</>, 'Nenhum piloto cadastrado.')}
    {section('Mecânicos', team.mechanics, (mechanic) => <><strong>{mechanic.name}</strong>{mechanic.specialty && <span>{mechanic.specialty}</span>}</>, 'Nenhum mecânico cadastrado.')}
    {section('Carros', team.cars, (car) => <><strong>{car.name}</strong><span>{[car.model, car.engine].filter(Boolean).join(' · ') || 'Detalhes não informados'}{car.horsepower ? ` · ${car.horsepower} cv` : ''}{car.qualifyingTime ? ` · ${car.qualifyingTime}s` : ''}</span></>, 'Nenhum carro cadastrado.')}
  </div>;
}

function App() {
  const [apiUrl, setApiUrl] = useState(() => {
    const savedUrl = localStorage.getItem('dragteam-api-url');
    return !savedUrl || savedUrl === 'http://localhost:3000' ? defaultUrl : savedUrl;
  });
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [expandedTeamId, setExpandedTeamId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const connect = useCallback(async (url = apiUrl) => {
    const base = url.trim().replace(/\/+$/, '');
    if (!base) { setError('Informe a URL base da sua API.'); return; }
    setLoading(true);
    setError('');
    localStorage.setItem('dragteam-api-url', base);
    try {
      const response = await fetch(`${base}/api/team`, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`A API respondeu com status ${response.status}.`);
      const payload = await response.json();
      setTeams(readTeams(payload));
      setConnected(true);
      setLastUpdated(new Date());
    } catch (e) {
      setConnected(false);
      setError(e instanceof TypeError ? 'Não foi possível acessar a API. Confira a URL, o servidor e a configuração de CORS.' : e.message || 'Falha ao consultar a API.');
    } finally { setLoading(false); }
  }, [apiUrl]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void connect(); }, 0);
    return () => window.clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredTeams = useMemo(() => teams.filter((team, index) => {
    const name = getName(team, index).toLowerCase();
    const detail = `${team.city || ''} ${(team.drivers || []).map((driver) => `${driver.name || ''} ${driver.nickname || ''}`).join(' ')} ${(team.mechanics || []).map((mechanic) => `${mechanic.name || ''} ${mechanic.specialty || ''}`).join(' ')} ${(team.cars || []).map((car) => `${car.name || ''} ${car.model || ''} ${car.engine || ''}`).join(' ')}`.toLowerCase();
    return `${name} ${detail}`.includes(query.toLowerCase());
  }), [teams, query]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#inicio" aria-label="DragTeam início"><span className="brand-mark"><Gauge size={22} /></span><span>drag<span className="brand-light">team</span></span></a>
        <div className="workspace-label">WORKSPACE</div>
        <button className="workspace"><span className="workspace-dot" />Minha equipe<ChevronDown size={15} /></button>
        <div className="nav-label">MENU PRINCIPAL</div>
        <nav><a className="nav-item active" href="#equipes"><Users size={18} />Equipes</a><a className="nav-item" href="#atividade"><Activity size={18} />Atividade</a></nav>
        <div className="sidebar-bottom"><div className="api-mini"><span className={`status-dot ${connected ? 'online' : ''}`} /><span>{connected ? 'API conectada' : 'API desconectada'}</span></div><button className="nav-item settings-link" onClick={() => setShowSettings((v) => !v)}><Settings2 size={18} />Configurações</button><div className="profile"><div className="profile-avatar">DT</div><div><strong>DragTeam</strong><small>Painel de controle</small></div><ChevronDown size={15} /></div></div>
      </aside>

      <main className="main" id="inicio">
        <header className="topbar"><div className="breadcrumbs">Workspace <span>/</span> <strong>Equipes</strong></div><div className="top-actions"><span className="environment"><span className="status-dot online" /> Ambiente de desenvolvimento</span><button className="icon-button" aria-label="Ajuda"><CircleHelp size={19} /></button><div className="user-avatar">B</div></div></header>
        <section className="content" id="equipes">
          <div className="page-heading"><div><div className="eyebrow">GESTÃO DE COMPETIÇÃO</div><h1>Equipes</h1><p>Visualize as equipes registradas na sua DragTeamAPI.</p></div><button className="button button-secondary" onClick={() => connect()} disabled={loading}><RefreshCw size={16} className={loading ? 'spin' : ''} />Atualizar</button></div>

          <section className={`connection-card ${connected ? 'is-connected' : ''}`}>
            <div className="connection-icon">{connected ? <Wifi size={19} /> : <Link2 size={19} />}</div>
            <div className="connection-copy"><strong>{connected ? 'Conexão ativa' : 'Conecte sua API'}</strong><span>{connected ? apiUrl : 'Informe o endereço da sua DragTeamAPI para carregar as equipes.'}</span></div>
            <div className="connection-control"><label className="sr-only" htmlFor="api-url">URL base da API</label><input id="api-url" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && connect()} placeholder="https://sua-api.com" /><button className="button button-primary" onClick={() => connect()} disabled={loading}>{loading ? <LoaderCircle size={16} className="spin" /> : <Link2 size={16} />}{loading ? 'Conectando' : 'Conectar'}</button></div>
          </section>
          {error && <div className="error-banner"><WifiOff size={17} /><span>{error}</span></div>}
          {showSettings && <div className="settings-note"><strong>Configuração da integração</strong><span>O painel consulta <code>GET {apiUrl.replace(/\/+$/, '') || 'https://sua-api.com'}/api/team</code>. A API precisa permitir requisições do navegador via CORS.</span></div>}

          <div className="stats-grid"><article className="stat-card"><div className="stat-top"><span>Total de equipes</span><span className="stat-icon purple"><Users size={17} /></span></div><strong>{connected ? teams.length : '—'}</strong><small>{connected ? 'Equipes retornadas pela API' : 'Conecte a API para carregar'}</small></article><article className="stat-card"><div className="stat-top"><span>Status da conexão</span><span className="stat-icon green"><Activity size={17} /></span></div><strong className="stat-status"><span className={`status-dot ${connected ? 'online' : ''}`} />{connected ? 'Online' : 'Aguardando'}</strong><small>{lastUpdated ? `Atualizado às ${lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Sem sincronização recente'}</small></article><article className="stat-card"><div className="stat-top"><span>Endpoint</span><span className="stat-icon orange"><Link2 size={17} /></span></div><strong className="endpoint-stat">/api/team</strong><small>Método GET · JSON</small></article></div>

          <section className="table-card"><div className="table-heading"><div><h2>Lista de equipes</h2><p>{connected ? `${filteredTeams.length} ${filteredTeams.length === 1 ? 'equipe encontrada' : 'equipes encontradas'}` : 'Os dados aparecerão aqui após a conexão.'}</p></div><div className="table-tools"><div className="search-box"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar equipe..." aria-label="Buscar equipe" /></div><button className="filter-button" aria-label="Ordenar equipes"><ArrowDownUp size={16} /></button></div></div>
            <div className="table-scroll"><table><thead><tr><th>EQUIPE</th><th>CIDADE</th><th>PILOTOS</th><th>MECÂNICOS</th><th>CARROS</th><th></th></tr></thead><tbody>
              {loading ? <tr><td colSpan="6"><div className="empty-state"><LoaderCircle className="spin" size={22} /><span>Buscando equipes na API...</span></div></td></tr> : filteredTeams.length ? filteredTeams.map((team, index) => { const name = getName(team, index); const id = team.id ?? team._id ?? index; const expanded = expandedTeamId === id; return <Fragment key={id}><tr><td><div className="team-cell"><div className="team-avatar">{getInitials(name)}</div><div><strong>{name}</strong><small>ID {team.id ?? team._id ?? '—'}</small></div></div></td><td>{team.city || '—'}</td><td>{team.drivers?.length ?? 0}</td><td>{team.mechanics?.length ?? 0}</td><td><span className="car-cell"><CarFront size={16} />{team.cars?.length ?? 0}</span></td><td><button className="detail-button" onClick={() => setExpandedTeamId(expanded ? null : id)} aria-expanded={expanded}>{expanded ? 'Fechar' : 'Detalhes'}</button></td></tr>{expanded && <tr className="details-row"><td colSpan="6"><TeamDetails team={team} /></td></tr>}</Fragment>; }) : <tr><td colSpan="6"><div className="empty-state"><div className="empty-icon"><Users size={23} /></div><strong>{connected ? (query ? 'Nenhuma equipe encontrada' : 'Nenhuma equipe cadastrada') : 'Aguardando conexão'}</strong><span>{connected ? (query ? 'Tente outro termo de busca.' : 'Quando a API retornar equipes, elas serão listadas aqui.') : 'Conecte sua DragTeamAPI usando o endereço acima.'}</span></div></td></tr>}
            </tbody></table></div><div className="table-footer"><span>Dados fornecidos pela DragTeamAPI</span><span className="footer-live"><span className={`status-dot ${connected ? 'online' : ''}`} />{connected ? 'Sincronizado' : 'Desconectado'}</span></div></section>
          <footer className="page-footer">DragTeam <span>·</span> Painel de controle <span className="footer-version">Frontend conectado à sua API</span></footer>
        </section>
      </main>
    </div>
  );
}

export default App;