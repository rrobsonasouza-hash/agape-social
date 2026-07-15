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
      throw new Error("CEP não encontrado.");
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
      const respostaCoordenadas =
        await this.repository.buscarCoordenadasPorCep(cep);
      const coordenadas = coordenadasCepResponseSchema.parse(
        respostaCoordenadas
      ).location.coordinates;
      const latitude = Number(coordenadas.latitude);
      const longitude = Number(coordenadas.longitude);

      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        endereco.latitude = latitude;
        endereco.longitude = longitude;
      }
    } catch {
      try {
        const respostaAlternativa =
          await this.repository.buscarCoordenadasAlternativasPorCep(cep, {
            logradouro: dados.logradouro,
            cidade: dados.localidade,
            estado: dados.uf,
          });
        const coordenadasAlternativas =
          coordenadasNominatimResponseSchema.parse(respostaAlternativa)[0];

        if (coordenadasAlternativas) {
          const latitude = Number(coordenadasAlternativas.lat);
          const longitude = Number(coordenadasAlternativas.lon);

          if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
            endereco.latitude = latitude;
            endereco.longitude = longitude;
          }
        }
      } catch {
        // O endereço continua válido e o ponto pode ser ajustado manualmente.
      }
    }

    return endereco;
  }
}
