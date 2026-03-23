import {Component, effect, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Paciente} from './models/paciente';
import {Tecnico} from './models/tecnico';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  pacientes = signal<Paciente[]>([]);
  tecnicosInput = signal<string>('');
  escalaGerada = signal<Tecnico[]>([]);

  novoNome = '';
  novoQuarto: number = 1;
  novaCriticidade: 1 | 3 | 5 = 1;

  constructor() {
    // Efeito do Angular: Sempre que 'pacientes' ou 'tecnicosInput' mudar, salva no Storage
    effect(() => {
      localStorage.setItem('pacientes_data', JSON.stringify(this.pacientes()));
      localStorage.setItem('tecnicos_data', this.tecnicosInput());
    });
  }

  ngOnInit() {
    // Carrega os dados ao iniciar o App
    const savedPacientes = localStorage.getItem('pacientes_data');
    const savedTecnicos = localStorage.getItem('tecnicos_data');

    if (savedPacientes) this.pacientes.set(JSON.parse(savedPacientes));
    if (savedTecnicos) this.tecnicosInput.set(savedTecnicos);
  }

  // adicionarPaciente() {
  //   if (this.novoNome) {
  //     const atual = this.pacientes();
  //     this.pacientes.set([...atual, {
  //       nome: this.novoNome,
  //       quarto: this.novoQuarto,
  //       criticidade: this.novaCriticidade
  //     }].sort((a, b) => a.quarto - b.quarto));
  //
  //     this.novoNome = '';
  //     this.novoQuarto++; // Incremento automático para facilitar o cadastro sequencial
  //   }
  // }
  adicionarPaciente() {
    // 1. Validação básica: Não permite adicionar sem nome
    if (!this.novoNome || this.novoNome.trim() === '') {
      alert("Por favor, digite o nome do paciente.");
      return;
    }

    // 2. Validação de Duplicidade: Verifica se o quarto selecionado já está na lista
    const quartoOcupado = this.pacientes().some(p => p.quarto === this.novoQuarto);

    if (quartoOcupado) {
      alert(`O Quarto ${this.novoQuarto} já possui um paciente! Remova o anterior ou escolha outro quarto.`);
      return; // Para a execução aqui e não adiciona
    }

    // 3. Adição: Se passou nas validações, adiciona ao Signal
    const novoPaciente = {
      nome: this.novoNome,
      quarto: this.novoQuarto,
      criticidade: this.novaCriticidade
    };

    // Atualiza a lista e já mantém ordenada por número de quarto
    this.pacientes.set(
      [...this.pacientes(), novoPaciente].sort((a, b) => a.quarto - b.quarto)
    );

    // 4. Limpeza e Próximo Passo
    this.novoNome = ''; // Limpa o campo de nome para o próximo

    // Incremento Inteligente: Pula para o próximo quarto automaticamente (até o limite de 12)
    if (this.novoQuarto < 12) {
      this.novoQuarto++;
    }
  }

  removerPaciente(index: number) {
    const atual = this.pacientes();
    atual.splice(index, 1);
    this.pacientes.set([...atual]);
  }

  limparEscala() {
    // Verificação de segurança
    const confirmar = confirm("Deseja realmente apagar a escala gerada? Os pacientes continuarão na lista.");

    if (confirmar) {
      // Ao resetar o Signal para um array vazio, o botão de limpar
      // será desabilitado automaticamente pelo Angular
      this.escalaGerada.set([]);
    }
  }

  // gerarEscala() {
  //   const nomes = this.tecnicosInput().split(',').map(n => n.trim()).filter(n => n !== '');
  //   if (nomes.length === 0 || this.pacientes().length === 0) return;
  //
  //   // 1. DISTRIBUIÇÃO INICIAL (O "Grosso" da escala)
  //   let resultado: Tecnico[] = nomes.map(nome => ({nome, quartos: [], totalPontos: 0}));
  //   const pacientes = [...this.pacientes()].sort((a, b) => a.quarto - b.quarto);
  //   const mediaAlvo = pacientes.reduce((acc, p) => acc + p.criticidade, 0) / nomes.length;
  //
  //   let pIndex = 0;
  //   for (let i = 0; i < resultado.length; i++) {
  //     while (pIndex < pacientes.length) {
  //       const p = pacientes[pIndex];
  //       if (i === resultado.length - 1) {
  //         resultado[i].quartos!.push(p);
  //         resultado[i].totalPontos! += p.criticidade;
  //         pIndex++;
  //         continue;
  //       }
  //       const erroAtual = Math.abs(resultado[i].totalPontos! - mediaAlvo);
  //       const erroSeAdicionar = Math.abs((resultado[i].totalPontos! + p.criticidade) - mediaAlvo);
  //       if (erroSeAdicionar <= erroAtual || resultado[i].totalPontos === 0) {
  //         resultado[i].quartos!.push(p);
  //         resultado[i].totalPontos! += p.criticidade;
  //         pIndex++;
  //       } else {
  //         break;
  //       }
  //     }
  //   }
  //
  //   // 2. REFINAMENTO BIDIRECIONAL (COM DEBUG)
  //   console.log("--- Iniciando Refinamento de Fronteira ---");
  //
  //   // 2. REFINAMENTO COM PERMUTA (A "Troca de Figurinhas")
  //   for (let i = 0; i < resultado.length - 1; i++) {
  //     const atual = resultado[i];
  //     const proximo = resultado[i + 1];
  //
  //     if (atual.quartos!.length > 0 && proximo.quartos!.length > 0) {
  //       const diffOriginal = Math.abs(atual.totalPontos! - proximo.totalPontos!);
  //
  //       const ultimoAtu = atual.quartos![atual.quartos!.length - 1];
  //       const primeiroProx = proximo.quartos![0];
  //
  //       // TESTE DA PERMUTA: Maria dá o Q5(3) e recebe o Q6(1)
  //       const novoTotalAtuPermuta = atual.totalPontos! - ultimoAtu.criticidade + primeiroProx.criticidade;
  //       const novoTotalProxPermuta = proximo.totalPontos! + ultimoAtu.criticidade - primeiroProx.criticidade;
  //       const diffPermuta = Math.abs(novoTotalAtuPermuta - novoTotalProxPermuta);
  //
  //       // TESTE DE CESSÃO: Maria apenas dá o Q5(3)
  //       const diffCessao = Math.abs((atual.totalPontos! - ultimoAtu.criticidade) - (proximo.totalPontos! + ultimoAtu.criticidade));
  //
  //       console.log(`Analisando ${atual.nome} vs ${proximo.nome}:`);
  //       console.log(`- Atual: ${diffOriginal} | Se Permutar: ${diffPermuta} | Se Ceder: ${diffCessao}`);
  //
  //       // Executa a Permuta se for a melhor opção e diminuir a diferença original
  //       if (diffPermuta < diffOriginal && diffPermuta <= diffCessao) {
  //         console.log(`✅ PERMUTA REALIZADA: ${atual.nome} trocou Q${ultimoAtu.quarto} por Q${primeiroProx.quarto}`);
  //
  //         // Realiza a troca física nos arrays
  //         const qMaria = atual.quartos!.pop()!;
  //         const qLuciene = proximo.quartos!.shift()!;
  //
  //         atual.quartos!.push(qLuciene);
  //         proximo.quartos!.unshift(qMaria);
  //
  //         atual.totalPontos = novoTotalAtuPermuta;
  //         proximo.totalPontos = novoTotalProxPermuta;
  //
  //         i = -1; // Reinicia para checar se a nova Maria precisa permutar com Godofredina
  //       }
  //       // Se a permuta não for boa, mas ceder um quarto for:
  //       else if (diffCessao < diffOriginal) {
  //         console.log(`✅ CESSÃO REALIZADA: ${atual.nome} passou Q${ultimoAtu.quarto} para ${proximo.nome}`);
  //         proximo.quartos!.unshift(atual.quartos!.pop()!);
  //         atual.totalPontos! -= ultimoAtu.criticidade;
  //         proximo.totalPontos! += ultimoAtu.criticidade;
  //         i = -1;
  //       }
  //     }
  //   }
  //   console.log("--- Fim do Refinamento ---", resultado);
  //
  //   this.escalaGerada.set(resultado);
  // }

  // calcularPeso(pontos: number): number {
  //   if (pontos === 5) return 10;   // 🔴 MUITO PESADO
  //   if (pontos === 3) return 3.5;  // 🟡 médio
  //   return 1;                      // 🟢 leve
  // }
  //
  // gerarEscala() {
  //   const listaTecnicos = this.tecnicosInput()
  //     .split(',')
  //     .map(n => n.trim())
  //     .filter(n => n !== '');
  //
  //   let pacientes = [...this.pacientes()]
  //     .sort((a, b) => a.quarto - b.quarto);
  //
  //   const LIMITE_DIST = 2;
  //
  //   const peso = (p: Paciente) => this.calcularPeso(p.criticidade);
  //
  //   const total = pacientes.reduce((acc, p) => acc + peso(p), 0);
  //   const media = total / listaTecnicos.length;
  //
  //   let resultado: Tecnico[] = listaTecnicos.map(nome => ({
  //     nome,
  //     quartos: [],
  //     totalPontos: 0
  //   }));
  //
  //   // =====================================================
  //   // 🔹 FASE 1 — DISTRIBUIÇÃO COM SCORE (CORRETA)
  //   // =====================================================
  //
  //   pacientes.forEach(p => {
  //
  //     let melhor: Tecnico | null = null;
  //     let melhorScore = Infinity;
  //
  //     for (const t of resultado) {
  //
  //       const ultimo = t.quartos[t.quartos.length - 1];
  //
  //       const distancia = ultimo ? Math.abs(p.quarto - ultimo.quarto) : 0;
  //
  //       // 🔥 penaliza distância (não bloqueia)
  //       const penalidadeDist = distancia > LIMITE_DIST ? distancia * 2 : 0;
  //
  //       const novoTotal = t.totalPontos + peso(p);
  //
  //       const score =
  //         Math.abs(novoTotal - media) + penalidadeDist;
  //
  //       if (score < melhorScore) {
  //         melhorScore = score;
  //         melhor = t;
  //       }
  //     }
  //
  //     // fallback (nunca deveria acontecer, mas segurança)
  //     if (!melhor) {
  //       melhor = resultado.sort((a, b) => a.totalPontos - b.totalPontos)[0];
  //     }
  //
  //     melhor.quartos.push(p);
  //     melhor.totalPontos += peso(p);
  //   });
  //
  //   // =====================================================
  //   // 🔹 UTIL
  //   // =====================================================
  //
  //   const respeitaDist = (qs: Paciente[], limite = LIMITE_DIST) => {
  //     for (let i = 1; i < qs.length; i++) {
  //       if (Math.abs(qs[i].quarto - qs[i - 1].quarto) > limite) {
  //         return false;
  //       }
  //     }
  //     return true;
  //   };
  //
  //   const diferenca = () => {
  //     const pts = resultado.map(t => t.totalPontos);
  //     return Math.max(...pts) - Math.min(...pts);
  //   };
  //
  //   // =====================================================
  //   // 🔹 FASE 2 — AJUSTE RÁPIDO
  //   // =====================================================
  //
  //   for (let k = 0; k < 5; k++) {
  //
  //     for (let i = 0; i < resultado.length; i++) {
  //       for (let j = 0; j < resultado.length; j++) {
  //
  //         if (i === j) continue;
  //
  //         const origem = resultado[i];
  //         const destino = resultado[j];
  //
  //         if (origem.totalPontos <= media) continue;
  //
  //         const q = origem.quartos[origem.quartos.length - 1];
  //         if (!q) continue;
  //
  //         const novaOrigem = origem.quartos.slice(0, -1);
  //         const novoDestino = [...destino.quartos, q]
  //           .sort((a, b) => a.quarto - b.quarto);
  //
  //         if (!respeitaDist(novaOrigem, 3) || !respeitaDist(novoDestino, 3)) continue;
  //
  //         const novoOrigemPts = origem.totalPontos - peso(q);
  //         const novoDestinoPts = destino.totalPontos + peso(q);
  //
  //         const erroAtual =
  //           Math.abs(origem.totalPontos - media) +
  //           Math.abs(destino.totalPontos - media);
  //
  //         const erroNovo =
  //           Math.abs(novoOrigemPts - media) +
  //           Math.abs(novoDestinoPts - media);
  //
  //         if (erroNovo <= erroAtual) {
  //           origem.quartos = novaOrigem;
  //           destino.quartos = novoDestino;
  //
  //           origem.totalPontos = novoOrigemPts;
  //           destino.totalPontos = novoDestinoPts;
  //         }
  //       }
  //     }
  //
  //     if (diferenca() <= 2) break;
  //   }
  //
  //   // =====================================================
  //   // 🔹 FASE 3 — AJUSTE DIRECIONADO (GARANTE EQUILÍBRIO)
  //   // =====================================================
  //
  //   for (let tentativa = 0; tentativa < 10; tentativa++) {
  //
  //     const ordenados = [...resultado].sort((a, b) => b.totalPontos - a.totalPontos);
  //
  //     const mais = ordenados[0];
  //     const menos = ordenados[ordenados.length - 1];
  //
  //     const diff = mais.totalPontos - menos.totalPontos;
  //
  //     if (diff <= 2) break;
  //
  //     let moveFeito = false;
  //
  //     for (let i = mais.quartos.length - 1; i >= 0; i--) {
  //
  //       const q = mais.quartos[i];
  //       const p = peso(q);
  //
  //       const novaOrigem = mais.quartos
  //         .filter(x => x !== q)
  //         .sort((a, b) => a.quarto - b.quarto);
  //
  //       const novoDestino = [...menos.quartos, q]
  //         .sort((a, b) => a.quarto - b.quarto);
  //
  //       if (!respeitaDist(novaOrigem, 3) || !respeitaDist(novoDestino, 3)) continue;
  //
  //       const novoMais = mais.totalPontos - p;
  //       const novoMenos = menos.totalPontos + p;
  //
  //       const erroAtual =
  //         Math.abs(mais.totalPontos - media) +
  //         Math.abs(menos.totalPontos - media);
  //
  //       const erroNovo =
  //         Math.abs(novoMais - media) +
  //         Math.abs(novoMenos - media);
  //
  //       if (erroNovo <= erroAtual) {
  //         mais.quartos = novaOrigem;
  //         menos.quartos = novoDestino;
  //
  //         mais.totalPontos = novoMais;
  //         menos.totalPontos = novoMenos;
  //
  //         moveFeito = true;
  //         break;
  //       }
  //     }
  //
  //     if (!moveFeito) break;
  //   }
  //
  //   // =====================================================
  //   // 🔹 FINAL
  //   // =====================================================
  //
  //   resultado.forEach(t => {
  //     t.quartos.sort((a, b) => a.quarto - b.quarto);
  //   });
  //
  //   this.escalaGerada.set(resultado);
  // }

  calcularPeso(pontos: number): number {
    if (pontos === 5) return 10;   // 🔴 Crítico
    if (pontos === 3) return 3.5;  // 🟡 Médio
    return 1;                      // 🟢 Leve
  }

  // gerarEscala() {
  //   const listaTecnicos = this.tecnicosInput().split(',').map(n => n.trim()).filter(n => n !== '');
  //   if (listaTecnicos.length === 0) return;
  //
  //   let disponiveis = [...this.pacientes()].sort((a, b) => a.quarto - b.quarto);
  //   const getPeso = (p: any) => this.calcularPeso(p.criticidade);
  //
  //   const totalPesoCalculado = disponiveis.reduce((acc, p) => acc + getPeso(p), 0);
  //   const mediaAlvo = totalPesoCalculado / listaTecnicos.length;
  //
  //   let resultado: any[] = listaTecnicos.map(nome => ({
  //     nome,
  //     quartos: [],
  //     pontosCalculados: 0,
  //     totalPontos: 0
  //   }));
  //
  //   for (let i = 0; i < resultado.length; i++) {
  //     let tecnico = resultado[i];
  //
  //     // Se for o último técnico, pega o resto
  //     if (i === resultado.length - 1) {
  //       tecnico.quartos = [...disponiveis];
  //       disponiveis = [];
  //       break;
  //     }
  //
  //     while (disponiveis.length > 0) {
  //       let p1 = disponiveis[0];
  //
  //       // Peso que ainda não foi distribuído
  //       const pesoRestante = disponiveis.reduce((acc, p) => acc + getPeso(p), 0);
  //       const tecnicosQueFaltam = listaTecnicos.length - i;
  //       const mediaParaOsProximos = pesoRestante / tecnicosQueFaltam;
  //
  //       // REGRA DE PARADA:
  //       // 1. O técnico já tem pelo menos 1 paciente.
  //       // 2. Ele atingiu ou passou levemente da média alvo.
  //       // 3. E o mais importante: se ele parar, a média dos próximos não fica "insuportável".
  //       if (tecnico.quartos.length > 0 && tecnico.pontosCalculados >= (mediaAlvo - 1)) {
  //
  //         // Se a média do que sobrar for muito alta, ele CONTINUA pegando
  //         if (mediaParaOsProximos > mediaAlvo + 1) {
  //           // Continua pegando para ajudar o grupo...
  //         } else {
  //           break; // O pessoal da frente consegue segurar, ele para.
  //         }
  //       }
  //
  //       tecnico.quartos.push(p1);
  //       tecnico.pontosCalculados += getPeso(p1);
  //       disponiveis.shift();
  //     }
  //   }
  //
  //   // Ajuste Final: Se o último ficou muito leve (como a Roberta com 3 pts)
  //   // Tentamos passar o primeiro quarto do técnico anterior para ele
  //   const ultimo = resultado[resultado.length - 1];
  //   const penultimo = resultado[resultado.length - 2];
  //
  //   if (ultimo && penultimo && (penultimo.pontosCalculados > ultimo.pontosCalculados + 5)) {
  //     const qParaMover = penultimo.quartos.pop();
  //     if (qParaMover) {
  //       ultimo.quartos.unshift(qParaMover);
  //       penultimo.pontosCalculados -= getPeso(qParaMover);
  //       ultimo.pontosCalculados += getPeso(qParaMover);
  //     }
  //   }
  //
  //   // Soma final para exibição
  //   resultado.forEach(t => {
  //     t.quartos.sort((a: any, b: any) => a.quarto - b.quarto);
  //     t.totalPontos = t.quartos.reduce((acc: number, p: any) => acc + p.criticidade, 0);
  //   });
  //
  //   this.escalaGerada.set(resultado);
  // }

  gerarEscala() {
    const listaTecnicos = this.tecnicosInput()
      .split(',')
      .map(n => n.trim())
      .filter(n => n !== '');

    if (listaTecnicos.length === 0) return;

    let pacientes = [...this.pacientes()]
      .sort((a, b) => a.quarto - b.quarto);

    const getPeso = (p: any) => this.calcularPeso(p.criticidade);

    const totalPeso = pacientes.reduce((acc, p) => acc + getPeso(p), 0);
    const media = totalPeso / listaTecnicos.length;

    let resultado: any[] = listaTecnicos.map(nome => ({
      nome,
      quartos: [],
      pontosCalculados: 0,
      totalPontos: 0
    }));

    // =====================================================
    // 🔥 FASE 1 — DISTRIBUIÇÃO PELO CENTRO
    // =====================================================

    // começa do meio
    let esquerda = Math.floor((pacientes.length - 1) / 2);
    let direita = esquerda + 1;

    let lado = 0;

    while (esquerda >= 0 || direita < pacientes.length) {

      let p;

      if (lado % 2 === 0 && esquerda >= 0) {
        p = pacientes[esquerda--];
      } else if (direita < pacientes.length) {
        p = pacientes[direita++];
      } else if (esquerda >= 0) {
        p = pacientes[esquerda--];
      }

      lado++;

      if (!p) continue;

      // escolhe melhor técnico (menos carregado)
      let melhor = resultado.sort((a, b) => a.pontosCalculados - b.pontosCalculados)[0];

      melhor.quartos.push(p);
      melhor.pontosCalculados += getPeso(p);
    }

    // =====================================================
    // 🔥 FASE 2 — AJUSTE INTELIGENTE (permite Q1 ir pra Roberta)
    // =====================================================

    for (let t = 0; t < 10; t++) {

      const ordenados = [...resultado].sort((a, b) => b.pontosCalculados - a.pontosCalculados);

      const mais = ordenados[0];
      const menos = ordenados[ordenados.length - 1];

      const diff = mais.pontosCalculados - menos.pontosCalculados;
      if (diff <= 2) break;

      let moveFeito = false;

      for (const q of [...mais.quartos]) {

        const peso = getPeso(q);

        const novoMais = mais.pontosCalculados - peso;
        const novoMenos = menos.pontosCalculados + peso;

        const erroAtual =
          Math.abs(mais.pontosCalculados - media) +
          Math.abs(menos.pontosCalculados - media);

        const erroNovo =
          Math.abs(novoMais - media) +
          Math.abs(novoMenos - media);

        if (erroNovo <= erroAtual) {

          mais.quartos = mais.quartos.filter((x: Paciente) => x !== q);
          menos.quartos.push(q);

          mais.pontosCalculados = novoMais;
          menos.pontosCalculados = novoMenos;

          moveFeito = true;
          break;
        }
      }

      if (!moveFeito) break;
    }

    // =====================================================
    // 🔹 FINAL
    // =====================================================

    resultado.forEach(t => {
      t.quartos.sort((a: any, b: any) => a.quarto - b.quarto);
      t.totalPontos = t.quartos.reduce((acc: number, p: any) => acc + p.criticidade, 0);
    });

    this.escalaGerada.set(resultado);
  }

  formatarTecnicos() {
    if (this.tecnicosInput()) {
      const formatado = this.tecnicosInput()
        .split(',')
        .map(nome => nome.trim().toLowerCase().replace(/\b\w/g, l => l.toUpperCase()))
        .join(', ');
      this.tecnicosInput.set(formatado);
    }
  }

  // Adicione no topo do componente
  formatarNome() {
    if (this.novoNome) {
      // Transforma a primeira letra de cada palavra em maiúscula
      this.novoNome = this.novoNome
        .toLowerCase()
        .split(' ')
        .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
        .join(' ');
    }
  }


  compartilharWhatsApp() {
    const escala = this.escalaGerada();
    if (escala.length === 0) return;

    // Pega a data e a hora atual formatadas
    const data = new Date().toLocaleDateString('pt-BR');
    const hora = new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});

    // let mensagem = `📋 *ESCALA DO PLANTÃO*\n📅 ${data} às ${hora}\n\n`;
    let mensagem = `📋 *ESCALA DO PLANTÃO*\n🕒 ${data} — ${hora}\n\n`;
    // let mensagem = `📋 *ESCALA DO PLANTÃO*\n📌 ${data} às ${hora}\n\n`;

    escala.forEach(t => {
      // Usando pluralização correta para o resumo do WhatsApp também
      const unidade = t.totalPontos === 1 ? 'pt' : 'pts';
      mensagem += `*👤 TÉC(A): ${t.nome.toUpperCase()}* (${t.totalPontos} ${unidade})\n`;

      t.quartos?.forEach(p => {
        const icon = p.criticidade === 5 ? '🔴' : p.criticidade === 3 ? '🟡' : '🟢';
        mensagem += `${icon} Q${p.quarto}: ${p.nome}\n`;
      });
      mensagem += `\n`; // Apenas uma quebra entre técnicos para a mensagem não ficar gigante
    });

    mensagem += `\n_Gerado por: Escala Inteligente_`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  }
}
