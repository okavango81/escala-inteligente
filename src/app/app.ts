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
  //   const listaTecnicos = this.tecnicosInput().split(',').map(n => n.trim()).filter(n => n !== '');
  //   if (listaTecnicos.length === 0 || this.pacientes().length === 0) return;
  //
  //   const pacientes = [...this.pacientes()];
  //   const totalPontos = pacientes.reduce((acc, p) => acc + p.criticidade, 0);
  //   const mediaAlvo = totalPontos / listaTecnicos.length;
  //
  //   let resultado: Tecnico[] = listaTecnicos.map(nome => ({nome, quartos: [], totalPontos: 0}));
  //
  //   let pIndex = 0;
  //   for (let i = 0; i < resultado.length; i++) {
  //     // Enquanto o técnico atual estiver abaixo da média e ainda houver pacientes
  //     while (pIndex < pacientes.length) {
  //       const p = pacientes[pIndex];
  //       const diffAtual = Math.abs(resultado[i].totalPontos! - mediaAlvo);
  //       const diffComProximo = Math.abs((resultado[i].totalPontos! + p.criticidade) - mediaAlvo);
  //
  //       // Se adicionar o paciente deixa o técnico MAIS PERTO da média do que não adicionar
  //       // OU se ele for o último técnico (que precisa herdar o que sobrar)
  //       if (diffComProximo <= diffAtual || i === resultado.length - 1) {
  //         resultado[i].quartos!.push(p);
  //         resultado[i].totalPontos! += p.criticidade;
  //         pIndex++;
  //       } else {
  //         // Se adicionar piora o equilíbrio, passa para o próximo técnico
  //         break;
  //       }
  //     }
  //   }
  //   this.escalaGerada.set(resultado);
  // }
  gerarEscala() {
    const nomes = this.tecnicosInput().split(',').map(n => n.trim()).filter(n => n !== '');
    if (nomes.length === 0 || this.pacientes().length === 0) return;

    // 1. DISTRIBUIÇÃO INICIAL (O "Grosso" da escala)
    let resultado: Tecnico[] = nomes.map(nome => ({nome, quartos: [], totalPontos: 0}));
    const pacientes = [...this.pacientes()].sort((a, b) => a.quarto - b.quarto);
    const mediaAlvo = pacientes.reduce((acc, p) => acc + p.criticidade, 0) / nomes.length;

    let pIndex = 0;
    for (let i = 0; i < resultado.length; i++) {
      while (pIndex < pacientes.length) {
        const p = pacientes[pIndex];
        if (i === resultado.length - 1) {
          resultado[i].quartos!.push(p);
          resultado[i].totalPontos! += p.criticidade;
          pIndex++;
          continue;
        }
        const erroAtual = Math.abs(resultado[i].totalPontos! - mediaAlvo);
        const erroSeAdicionar = Math.abs((resultado[i].totalPontos! + p.criticidade) - mediaAlvo);
        if (erroSeAdicionar <= erroAtual || resultado[i].totalPontos === 0) {
          resultado[i].quartos!.push(p);
          resultado[i].totalPontos! += p.criticidade;
          pIndex++;
        } else {
          break;
        }
      }
    }

    // 2. REFINAMENTO BIDIRECIONAL (COM DEBUG)
    console.log("--- Iniciando Refinamento de Fronteira ---");

    // 2. REFINAMENTO COM PERMUTA (A "Troca de Figurinhas")
    for (let i = 0; i < resultado.length - 1; i++) {
      const atual = resultado[i];
      const proximo = resultado[i + 1];

      if (atual.quartos!.length > 0 && proximo.quartos!.length > 0) {
        const diffOriginal = Math.abs(atual.totalPontos! - proximo.totalPontos!);

        const ultimoAtu = atual.quartos![atual.quartos!.length - 1];
        const primeiroProx = proximo.quartos![0];

        // TESTE DA PERMUTA: Maria dá o Q5(3) e recebe o Q6(1)
        const novoTotalAtuPermuta = atual.totalPontos! - ultimoAtu.criticidade + primeiroProx.criticidade;
        const novoTotalProxPermuta = proximo.totalPontos! + ultimoAtu.criticidade - primeiroProx.criticidade;
        const diffPermuta = Math.abs(novoTotalAtuPermuta - novoTotalProxPermuta);

        // TESTE DE CESSÃO: Maria apenas dá o Q5(3)
        const diffCessao = Math.abs((atual.totalPontos! - ultimoAtu.criticidade) - (proximo.totalPontos! + ultimoAtu.criticidade));

        console.log(`Analisando ${atual.nome} vs ${proximo.nome}:`);
        console.log(`- Atual: ${diffOriginal} | Se Permutar: ${diffPermuta} | Se Ceder: ${diffCessao}`);

        // Executa a Permuta se for a melhor opção e diminuir a diferença original
        if (diffPermuta < diffOriginal && diffPermuta <= diffCessao) {
          console.log(`✅ PERMUTA REALIZADA: ${atual.nome} trocou Q${ultimoAtu.quarto} por Q${primeiroProx.quarto}`);

          // Realiza a troca física nos arrays
          const qMaria = atual.quartos!.pop()!;
          const qLuciene = proximo.quartos!.shift()!;

          atual.quartos!.push(qLuciene);
          proximo.quartos!.unshift(qMaria);

          atual.totalPontos = novoTotalAtuPermuta;
          proximo.totalPontos = novoTotalProxPermuta;

          i = -1; // Reinicia para checar se a nova Maria precisa permutar com Godofredina
        }
        // Se a permuta não for boa, mas ceder um quarto for:
        else if (diffCessao < diffOriginal) {
          console.log(`✅ CESSÃO REALIZADA: ${atual.nome} passou Q${ultimoAtu.quarto} para ${proximo.nome}`);
          proximo.quartos!.unshift(atual.quartos!.pop()!);
          atual.totalPontos! -= ultimoAtu.criticidade;
          proximo.totalPontos! += ultimoAtu.criticidade;
          i = -1;
        }
      }
    }
    console.log("--- Fim do Refinamento ---", resultado);

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

  // compartilharWhatsApp() {
  //   const escala = this.escalaGerada();
  //   if (escala.length === 0) return;
  //
  //   let mensagem = `📋 ESCALA DO PLANTÃO \n${new Date().toLocaleDateString()}\n\n`;
  //
  //   escala.forEach(t => {
  //     mensagem += `*👤 TÉC(A): ${t.nome.toUpperCase()}* (${t.totalPontos} pts)\n`;
  //     t.quartos?.forEach(p => {
  //       const icon = p.criticidade === 5 ? '🔴' : p.criticidade === 3 ? '🟡' : '🟢';
  //       mensagem += `${icon} Q${p.quarto}: ${p.nome}\n`;
  //     });
  //     mensagem += `\n\n`;
  //   });
  //
  //   mensagem += `_Gerado por: Escala Inteligente_`;
  //
  //   // Codifica a URI para o link do WhatsApp
  //   const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`;
  //   window.open(url, '_blank');
  // }
  compartilharWhatsApp() {
    const escala = this.escalaGerada();
    if (escala.length === 0) return;

    // Pega a data e a hora atual formatadas
    const data = new Date().toLocaleDateString('pt-BR');
    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

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
