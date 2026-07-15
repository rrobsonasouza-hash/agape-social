export interface EnderecoViaCep {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  ibge: string;
  latitude?: number;
  longitude?: number;
}
