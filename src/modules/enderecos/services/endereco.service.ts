import { EnderecoRepository } from "../repositories/endereco.repository";
import { enderecoViaCepResponseSchema } from "../schemas/endereco-viacep.schema";
import { coordenadasCepResponseSchema } from "../schemas/coordenadas-cep.schema";
import { coordenadasNominatimResponseSchema } from "../schemas/coordenadas-nominatim.schema";
import { EnderecoViaCep } from "../types/endereco-viacep";

export class EnderecoService {
  private repository = new EnderecoRepository();

  async buscarPorCep(cepInformado: string): Promise<EnderecoViaCep> {
    const cep = cepInformado.replace(/\D/g, "");

    if (cep.length !== 8) {
      throw new Error("Informe um CEP válido com 8 dígitos.");
    }

    const resposta = await this.repository.buscarPorCep(cep);
    const dados = enderecoViaCepResponseSchema.parse(resposta);

    if (dados.erro) {
      throw new Error(
        "CEP não encontrado. Confira os 8 dígitos ou preencha o endereço manualmente.",
      );
    }

    const endereco: EnderecoViaCep = {
      cep: dados.cep,
      logradouro: dados.logradouro,
      complemento: dados.complemento,
      bairro: dados.bairro,
      cidade: dados.localidade,
      estado: dados.uf,
      ibge: dados.ibge,
    };

    try {
      // Prioriza rua e CEP: algumas bases de CEP retornam apenas o centro da cidade.
      const respostaAlternativa = await this.repository.buscarCoordenadasAlternativasPorCep(cep, {
        logradouro: dados.logradouro,
        cidade: dados.localidade,
        estado: dados.uf,
      });
      const coordenadas = coordenadasNominatimResponseSchema.parse(respostaAlternativa)[0];
      const latitude = Number(coordenadas?.lat);
      const longitude = Number(coordenadas?.lon);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error("Endereço sem coordenadas precisas.");
      }

      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        endereco.latitude = latitude;
        endereco.longitude = longitude;
      }
    } catch {
      try {
        const respostaCoordenadas = await this.repository.buscarCoordenadasPorCep(cep);
        const coordenadas = coordenadasCepResponseSchema.parse(respostaCoordenadas).location.coordinates;
        const latitude = Number(coordenadas.latitude);
        const longitude = Number(coordenadas.longitude);
        if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
          endereco.latitude = latitude;
          endereco.longitude = longitude;
        }
      } catch {
        // O endereço continua válido e o ponto pode ser ajustado manualmente.
      }
    }

    return endereco;
  }
}
