export function WelcomeCard() {
  return (
    <div className="rounded-xl border bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-800">
        Bem-vindo ao Ágape Social ❤️
      </h2>

      <p className="mt-4 text-gray-600 leading-7">
        O Ágape Social foi desenvolvido para auxiliar paróquias,
        pastorais sociais e instituições beneficentes na gestão das
        famílias atendidas, voluntários, doações, estoque e entrega
        de cestas básicas.
      </p>

      <blockquote className="mt-6 border-l-4 border-blue-600 pl-4 italic text-gray-600">
        "Todas as vezes que fizestes isso a um destes meus irmãos
        mais pequeninos, foi a mim que o fizestes."
      </blockquote>

      <p className="mt-2 text-sm text-gray-500">
        Mateus 25,40
      </p>
    </div>
  );
}