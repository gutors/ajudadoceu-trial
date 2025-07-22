import React, { useState, useEffect } from 'react';
import './App.css';
import { AstrologicalData, DailyData } from './types';
import luaIcon from './assets/lua-icon.png';

// Dados astrológicos limitados (julho e agosto 2025)
let dadosDiarios: AstrologicalData | null = null;

// Função para carregar os dados astrológicos limitados
async function carregarDados(): Promise<void> {
  try {
    const response = await fetch("/dados_brinde.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: AstrologicalData = await response.json();
    dadosDiarios = data;
    console.log("Dados astrológicos de julho e agosto carregados com sucesso");
  } catch (error) {
    console.error("Erro ao carregar dados astrológicos:", error);
    alert("Erro ao carregar os dados astrológicos. Tente recarregar a página.");
  }
}

// Função para obter emoji/símbolo para cada fase da lua
function getFaseLuaEmoji(fase: string): string {
  switch (fase.toLowerCase()) {
    case 'nova': return '🌑';
    case 'crescente': return '🌓';
    case 'cheia': return '🌕';
    case 'minguante': return '🌗';
    default: return '';
  }
}

function App() {
  const [activeTab, setActiveTab] = useState<string>('consulta');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState<number>(6); // Julho (0-based)
  const [currentYear, setCurrentYear] = useState<number>(2025);
  const [resultadoConsulta, setResultadoConsulta] = useState<{ message: string; isFavorable: boolean } | null>(null);
  const [detalhesAstrologicos, setDetalhesAstrologicos] = useState<DailyData | null>(null);

  const mesesNomes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  useEffect(() => {
    carregarDados().then(() => {
      // Inicializar com julho de 2025
      setCurrentYear(2025);
      setCurrentMonth(6); // Julho
      setSelectedDate('2025-07-01');
    });
  }, []);

  const openTab = (tabName: string) => {
    setActiveTab(tabName);
  };

  const verificarData = (dateInput: string) => {
    if (!dateInput || !dadosDiarios) {
      setResultadoConsulta({ message: "Selecione uma data válida ou recarregue a página.", isFavorable: false });
      setDetalhesAstrologicos(null);
      return;
    }

    const dadosDoDia = dadosDiarios[dateInput];

    if (!dadosDoDia) {
      setResultadoConsulta({ message: "Dados disponíveis apenas para julho e agosto de 2025. Adquira o ebook completo para ter acesso a todos os meses!", isFavorable: false });
      setDetalhesAstrologicos(null);
      return;
    }

    const temLFC = dadosDoDia.lfc && dadosDoDia.lfc.length > 0;

    if (temLFC) {
      const horarios = dadosDoDia.lfc.map(p => `${p.inicio} às ${p.fim}`).join(', ');
      setResultadoConsulta({ message: `Lua Fora de Curso: ${horarios}`, isFavorable: false });
    } else {
      setResultadoConsulta({ message: "Dia FAVORÁVEL", isFavorable: true });
    }

    setDetalhesAstrologicos(dadosDoDia);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
    verificarData(e.target.value);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verificarData(selectedDate);
  };

  const handleRedirect = () => {
    window.open("https://applua.fengshuiedecoracao.com.br/ajudadoceu/", "_blank");
  };

  const renderCalendario = () => {
    if (!dadosDiarios) return null;

    const calendarioDias: JSX.Element[] = [];
    const primeiroDia = new Date(currentYear, currentMonth, 1);
    const ultimoDia = new Date(currentYear, currentMonth + 1, 0);
    const totalDias = ultimoDia.getDate();

    // Adicionar espaços vazios para os dias antes do primeiro dia do mês
    for (let i = 0; i < primeiroDia.getDay(); i++) {
      calendarioDias.push(<div key={`empty-${i}`} className="calendario-dia"></div>);
    }

    const hoje = new Date();
    const hojeStr = hoje.toISOString().split('T')[0];

    for (let dia = 1; dia <= totalDias; dia++) {
      const dataStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
      const dadosDoDia = dadosDiarios[dataStr];

      let diaClasses = "calendario-dia dia-mes";
      let titleText = "";
      let faseLuaEmoji = '';

      if (dataStr === hojeStr) {
        diaClasses += " dia-hoje";
      }

      if (dadosDoDia) {
        if (dadosDoDia.lfc && dadosDoDia.lfc.length > 0) {
          diaClasses += " dia-lfc";
          const horarios = dadosDoDia.lfc.map(p => `${p.inicio}-${p.fim}`).join(', ');
          titleText += `Lua Fora de Curso: ${horarios}`;
        } else {
          diaClasses += " dia-favoravel";
        }

        if (dadosDoDia.fase_lua) {
          faseLuaEmoji = getFaseLuaEmoji(dadosDoDia.fase_lua);
          if (titleText) titleText += " | ";
          titleText += `Lua ${dadosDoDia.fase_lua}`;
        }

        if (dadosDoDia.mercurio_retrogrado && dadosDoDia.mercurio_retrogrado.status) {
          diaClasses += " dia-mercurio-retro";
          if (titleText) titleText += " | ";
          titleText += `Mercúrio Retrógrado`;
        }

        if (dadosDoDia.eclipse) {
          diaClasses += " dia-eclipse";
          if (titleText) titleText += " | ";
          titleText += `Eclipse ${dadosDoDia.eclipse.tipo}`;
        }
      } else {
        diaClasses += " dia-invalido";
        titleText = "Disponível no ebook completo";
      }

      calendarioDias.push(
        <div
          key={dataStr}
          className={diaClasses}
          title={titleText}
          onClick={() => {
            if (dadosDoDia) {
              setSelectedDate(dataStr);
              verificarData(dataStr);
              openTab('consulta');
            } else {
              alert("Este mês está disponível apenas no ebook completo!");
            }
          }}
        >
          {dia}
          {faseLuaEmoji && <span className="fase-lua-indicator">{faseLuaEmoji}</span>}
        </div>
      );
    }

    return (
      <div className="calendario-grid">
        <div className="calendario-dia dia-semana">D</div>
        <div className="calendario-dia dia-semana">S</div>
        <div className="calendario-dia dia-semana">T</div>
        <div className="calendario-dia dia-semana">Q</div>
        <div className="calendario-dia dia-semana">Q</div>
        <div className="calendario-dia dia-semana">S</div>
        <div className="calendario-dia dia-semana">S</div>
        {calendarioDias}
      </div>
    );
  };

  const handlePrevMonth = () => {
    if (currentMonth === 6) { // Se está em julho, não pode voltar
      alert("Dados disponíveis apenas para julho e agosto. Adquira o ebook completo!");
      return;
    }
    setCurrentMonth(6); // Volta para julho
  };

  const handleNextMonth = () => {
    if (currentMonth === 7) { // Se está em agosto, não pode avançar
      alert("Dados disponíveis apenas para julho e agosto. Adquira o ebook completo!");
      return;
    }
    setCurrentMonth(7); // Vai para agosto
  };

  return (
    <div className="container">
      <header>
        <a href="#" className="logo">
          <img src={luaIcon} alt="Lua" width="40" height="40" />
          Ajuda do <span>Céu</span> - Brinde
        </a>
      </header>

      <div className="tabs">
        <button className={`tab ${activeTab === 'consulta' ? 'active' : ''}`} onClick={() => openTab('consulta')}>Consulta</button>
        <button className={`tab ${activeTab === 'calendario' ? 'active' : ''}`} onClick={() => openTab('calendario')}>Calendário</button>
        <button className={`tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => openTab('info')}>Info</button>
      </div>

      <div id="consulta" className={`tab-content ${activeTab === 'consulta' ? 'active' : ''}`}>
        <div className="consulta-card">
          <h1>Verificar Dia - Brinde</h1>
          <p className="brinde-info">📅 Dados disponíveis: <strong>Julho e Agosto 2025</strong></p>
          <form id="consulta-form" onSubmit={handleFormSubmit}>
            <div className="form-group">
              <label htmlFor="date-input">Selecione uma data:</label>
              <input type="date" id="date-input" min="2025-07-01" max="2025-08-31" value={selectedDate} onChange={handleDateChange} required />
            </div>
            <button type="submit" className="btn" id="check-button">Verificar</button>
          </form>
          {resultadoConsulta && (
            <div className={`resultado ${resultadoConsulta.isFavorable ? 'favoravel' : 'desfavoravel'}`}>
              {resultadoConsulta.message}
            </div>
          )}
          {detalhesAstrologicos && (
            <div id="detalhes-astrologicos">
              <h3>Detalhes Astrológicos</h3>
              <div className="detalhe-item">
                <strong>Fase da Lua:</strong> {getFaseLuaEmoji(detalhesAstrologicos.fase_lua)} {detalhesAstrologicos.fase_lua || 'N/A'}
              </div>
              <div className="detalhe-item">
                <strong>Lua Fora de Curso:</strong> {detalhesAstrologicos.lfc && detalhesAstrologicos.lfc.length > 0
                  ? `Sim (${detalhesAstrologicos.lfc.map(p => `${p.inicio} às ${p.fim}`).join(', ')})`
                  : 'Não'}
              </div>
              <div className="detalhe-item">
                <strong>Mercúrio Retrógrado:</strong> {detalhesAstrologicos.mercurio_retrogrado && detalhesAstrologicos.mercurio_retrogrado.status
                  ? `Sim (${detalhesAstrologicos.mercurio_retrogrado.periodo})`
                  : 'Não'}
              </div>
              {detalhesAstrologicos.outros_retrogrados && detalhesAstrologicos.outros_retrogrados.length > 0 && (
                <div className="detalhe-item">
                  <strong>Outros Retrógrados:</strong> {detalhesAstrologicos.outros_retrogrados.join(', ')}
                </div>
              )}
              {detalhesAstrologicos.transitos && detalhesAstrologicos.transitos.length > 0 && (
                <div className="detalhe-item">
                  <strong>Trânsitos Importantes:</strong> {detalhesAstrologicos.transitos.join(', ')}
                </div>
              )}
              {detalhesAstrologicos.eclipse && (
                <div className="detalhe-item">
                  <strong>Eclipse:</strong> {detalhesAstrologicos.eclipse.tipo} às {detalhesAstrologicos.eclipse.horario}. {detalhesAstrologicos.eclipse.descricao}
                </div>
              )}
            </div>
          )}
          
          <div className="cta-section">
            <h3>🌟 Quer o ano completo?</h3>
            <p>Este é apenas um brinde com os meses de Julho e Agosto de 2025. Adquira o ebook completo e tenha acesso a:</p>
            <ul>
              <li>✨ Dados de Janeiro 2025 a Março 2026</li>
              <li>🌙 Todas as fases da lua e horários da LFC (Lua fora de Curso)</li>
              <li>⚡ Períodos completos de Mercúrio Retrógrado</li>
              <li>🌟 Trânsitos planetários importantes</li>
              <li>🌒 Eclipses e seus significados</li>
            </ul>
            <button className="btn-cta" onClick={handleRedirect}>Adquirir Ebook Completo</button>
          </div>
        </div>
      </div>

      <div id="calendario" className={`tab-content ${activeTab === 'calendario' ? 'active' : ''}`}>
        <div className="consulta-card">
          <div className="calendario-header">
            <button id="prev-month" className="btn-nav" onClick={handlePrevMonth}>&lt;</button>
            <h2 id="current-month">{mesesNomes[currentMonth]} {currentYear}</h2>
            <button id="next-month" className="btn-nav" onClick={handleNextMonth}>&gt;</button>
          </div>
          {renderCalendario()}
          <div className="calendario-legenda">
            <div className="legenda-item">
              <div className="legenda-cor cor-favoravel"></div>
              <span>Favorável</span>
            </div>
            <div className="legenda-item">
              <div className="legenda-cor cor-desfavoravel"></div>
              <span>Lua Fora de Curso</span>
            </div>
            <div className="legenda-item">
              <div className="legenda-cor cor-hoje"></div>
              <span>Hoje</span>
            </div>
            <div className="legenda-item">
              <div className="legenda-cor cor-fase-lua"></div>
              <span>Fase da Lua</span>
            </div>
          </div>
          
          <div className="cta-section">
            <p><strong>📅 Brinde:</strong> Apenas Julho e Agosto de 2025</p>
            <p>Para ter acesso ao ano completo, adquira o ebook!</p>
            <button className="btn-cta" onClick={handleRedirect}>Ver Ebook Completo</button>
          </div>
        </div>
      </div>

      <div id="info" className={`tab-content ${activeTab === 'info' ? 'active' : ''}`}>
        <div className="info-card">
          <h3>🎁 Sobre este Brinde</h3>
          <p>Este aplicativo exclusivo contém dados astrológicos para <strong>Julho e Agosto de 2025</strong>. Ele é uma amostra grátis, para acessar a versão completa adquira o ebook completo "Ajuda do Céu".</p>
        </div>

        <div className="info-card">
          <h3>Lua Fora de Curso</h3>
          <p>Período em que a Lua não faz aspectos com outros planetas antes de mudar de signo. Não é recomendado iniciar projetos importantes ou tomar decisões cruciais.</p>
        </div>

        <div className="info-card">
          <h3>Fases da Lua</h3>
          <p><strong>Lua Nova:</strong> Momento de novos começos</p>
          <p><strong>Lua Crescente:</strong> Período de ação e desenvolvimento</p>
          <p><strong>Lua Cheia:</strong> Auge de energia e manifestação</p>
          <p><strong>Lua Minguante:</strong> Tempo de finalização e reflexão</p>
        </div>

        <div className="info-card">
          <h3>🌟 Ebook Completo</h3>
          <p>O ebook "Ajuda do Céu" contém:</p>
          <ul>
            <li>📅 Dados de Janeiro 2025 a Março 2026</li>
            <li>🌙 Todas as fases da lua e horários da LFC (Lua fora de Curso)</li>
            <li>⚡ Períodos completos de Mercúrio Retrógrado</li>
            <li>🌟 Trânsitos planetários importantes</li>
            <li>🌒 Eclipses e seus significados</li>
          </ul>
          <button className="btn-cta" onClick={handleRedirect}>Adquirir Agora</button>
        </div>
      </div>

      <footer>
        &copy; 2025 Ajuda do Céu - Brinde | Baseado no ebook de <span className="author">Letícia Andrade</span>
      </footer>
    </div>
  );
}

export default App;

