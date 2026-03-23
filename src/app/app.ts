import {Component, effect, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Paciente} from './models/paciente';
import {Tecnico} from './models/tecnico';
import {
  DragDropModule,
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem
} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  pacientes = signal<Paciente[]>([]);
  tecnicosInput = signal<string>('');
  escalaGerada = signal<Tecnico[]>([]);
  editandoPaciente = signal<any | null>(null);
  indiceEditando = -1;

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

  adicionarPaciente() {
    // 1. Validação básica: Não permite adicionar sem nome
    if (!this.novoNome || this.novoNome.trim() === '') {
      alert("Por favor, digite o nome do paciente.");
      return;
    }

    // 2. Validação de Duplicidade: Verifica se o quarto selecionado já está na lista
    if (this.quartoJaExiste(this.novoQuarto)) {
      alert(`O Quarto ${this.novoQuarto} já possui um paciente!`);
      return;
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
    const paciente = this.pacientes()[index];

    // Cria uma mensagem clara com o Quarto e Nome para não restar dúvida
    const mensagem = `Deseja realmente excluir o paciente do Quarto ${paciente.quarto} (${paciente.nome})?`;

    if (window.confirm(mensagem)) {
      const atual = this.pacientes();
      atual.splice(index, 1);
      this.pacientes.set([...atual]);

      // Opcional: Se a escala já estava gerada, você pode regerar
      // ou apenas limpar para evitar inconsistência visual
      if (this.pacientes().length < 1) {
        this.escalaGerada.set([]);
      }

      console.log(`Paciente do Q${paciente.quarto} removido com sucesso.`);
    }
  }

  abrirEdicao(p: any, index: number) {
    // Criamos uma cópia para não alterar a lista original antes de "Salvar"
    this.editandoPaciente.set({...p});
    this.indiceEditando = index;
  }

  fecharEdicao() {
    this.editandoPaciente.set(null);
    this.indiceEditando = -1;
  }

  private quartoJaExiste(quarto: number, idIgnorar: number = -1): boolean {
    return this.pacientes().some((p, index) => p.quarto === quarto && index !== idIgnorar);
  }

  salvarEdicao() {
    if (this.indiceEditando > -1) {
      const pacienteEditado = this.editandoPaciente()!;

      // Validação: O novo quarto escolhido já está ocupado por OUTRA pessoa?
      if (this.quartoJaExiste(pacienteEditado.quarto, this.indiceEditando)) {
        alert(`Erro: O Quarto ${pacienteEditado.quarto} já está ocupado por outro paciente!`);
        return; // Interrompe o salvamento
      }

      const listaAtual = [...this.pacientes()];
      listaAtual[this.indiceEditando] = pacienteEditado;

      // Mantém a lista ordenada caso o número do quarto tenha mudado na edição
      this.pacientes.set(listaAtual.sort((a, b) => a.quarto - b.quarto));

      this.fecharEdicao();
      this.gerarEscala();
    }
  }

  // O CdkDragDrop entra aqui apenas como TIPAGEM do evento
  drop(event: CdkDragDrop<Paciente[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
    this.recalcularPontosAposDrag();
  }

  private recalcularPontosAposDrag() {
    const escala = this.escalaGerada();
    escala.forEach(t => {
      // Recalcula criticidade real (exibição) e peso (lógica)
      t.totalPontos = t.quartos.reduce((acc, p) => acc + p.criticidade, 0);
      t.pontosCalculados = t.quartos.reduce((acc, p) => acc + this.calcularPeso(p.criticidade), 0);
    });
    this.escalaGerada.set([...escala]);
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

  calcularPeso(pontos: number): number {
    if (pontos === 5) return 7;   // 🔴 Crítico
    if (pontos === 3) return 4;  // 🟡 Médio
    return 1;                      // 🟢 Leve
  }

  gerarEscala() {
    const nomes = this.tecnicosInput().split(',').map(n => n.trim()).filter(n => n !== '');
    if (nomes.length === 0 || this.pacientes().length === 0) return;

    let pacientesDisponiveis = [...this.pacientes()].sort((a, b) => a.quarto - b.quarto);
    const totalPeso = pacientesDisponiveis.reduce((acc, p) => acc + this.calcularPeso(p.criticidade), 0);
    const mediaAlvo = totalPeso / nomes.length;

    let resultado = nomes.map(nome => ({
      nome,
      quartos: [] as any[],
      pontosCalculados: 0,
      totalPontos: 0
    }));

    let tecnicoIndex = 0;

    for (const p of pacientesDisponiveis) {
      let tecnicoAtual = resultado[tecnicoIndex];
      const pesoP = this.calcularPeso(p.criticidade);

      if (tecnicoIndex < nomes.length - 1 && tecnicoAtual.quartos.length > 0) {
        const carga = tecnicoAtual.pontosCalculados;

        // Regra de Ouro: Se a soma estoura a média, passa para o próximo
        if (carga >= mediaAlvo || (carga + pesoP > mediaAlvo && tecnicoAtual.quartos.length >= 2)) {
          tecnicoIndex++;
          tecnicoAtual = resultado[tecnicoIndex];
        }
      }

      tecnicoAtual.quartos.push(p);
      tecnicoAtual.pontosCalculados += pesoP;
    }

    resultado.forEach(t => {
      t.quartos.sort((a, b) => a.quarto - b.quarto);
      t.totalPontos = t.quartos.reduce((acc, p) => acc + p.criticidade, 0);
    });

    this.escalaGerada.set(resultado);
  }


  formatarNome(alvo?: any) {
    // Se não passar nada, formata o novoNome (cadastro)
    // Se passar o objeto do modal, formata o nome dele
    if (alvo) {
      alvo.nome = this.aplicarCapitalize(alvo.nome);
    } else {
      this.novoNome = this.aplicarCapitalize(this.novoNome);
    }
  }

// Extraia a lógica de Capitalize para não repetir código
  private aplicarCapitalize(valor: string): string {
    return valor
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
