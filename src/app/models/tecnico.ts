import {Paciente} from './paciente';

export interface Tecnico {
  nome: string;
  quartos?: Paciente[];
  totalPontos?: number;
}
