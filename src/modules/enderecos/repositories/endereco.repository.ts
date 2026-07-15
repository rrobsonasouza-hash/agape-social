export class EnderecoRepository {
  async buscarPorCep(cep: string): Promise<unknown> {
    const resposta = await fetch(
      `https://viacep.com.br/ws/${cep}/json/`
    );

    if (!resposta.ok) {
      throw new Error("Não foi possível consultar o CEP.");
    }

    return resposta.json();
  }

  async buscarCoordenadasPorCep(cep: string): Promise<unknown> {
    const resposta = await fetch(
      `https://brasilapi.com.br/api/cep/v2/${cep}`
    );

    if (!resposta.ok) {
      throw new Error("Coordenadas do CEP não encontradas.");
    }

    return resposta.json();
  }

  async buscarCoordenadasAlternativasPorCep(
    cep: string,
    endereco: { logradouro: string; cidade: string; estado: string }
  ): Promise<unknown> {
    const parametros = new URLSearchParams({
      postalcode: cep,
      street: endereco.logradouro,
      city: endereco.cidade,
      state: endereco.estado,
      country: "Brasil",
      countrycodes: "br",
      format: "jsonv2",
      limit: "1",
    });
    const resposta = await fetch(
      `https://nominatim.openstreetmap.org/search?${parametros.toString()}`
    );

    if (!resposta.ok) {
      throw new Error("Coordenadas alternativas não encontradas.");
    }

    return resposta.json();
  }
}
