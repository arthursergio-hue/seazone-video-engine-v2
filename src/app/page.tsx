import Link from 'next/link';

export default function Home() {
  return (
    <div className="space-y-12">
      <div className="text-center space-y-4 pt-12">
        <h1 className="text-4xl font-bold text-white">Seazone Video Engine</h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Transforme imagens reais de empreendimentos em videos cinematograficos
          prontos para redes sociais usando IA.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
        {[
          { href: '/projeto', title: 'Criar Projeto', desc: 'Configure um novo empreendimento' },
          { href: '/upload', title: 'Upload de Imagens', desc: 'Envie fotos por categoria' },
          { href: '/gerar', title: 'Pipeline', desc: 'Gere imagens, aprove e crie o video' },
          { href: '/resultados', title: 'Resultados', desc: 'Veja os videos gerados' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-blue-500 transition group"
          >
            <h2 className="text-white font-semibold group-hover:text-blue-400 transition">
              {item.title}
            </h2>
            <p className="text-gray-500 text-sm mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>

      <div className="max-w-2xl mx-auto">
        <h2 className="text-white font-semibold mb-4">Pipeline de Geracao</h2>
        <div className="flex items-center gap-2 text-sm flex-wrap">
          {['Tipo', 'Gerar Imagens', 'Aprovar', 'Gerar Video', 'Resultado'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <span className="bg-gray-800 text-gray-300 px-3 py-1.5 rounded">{step}</span>
              {i < 4 && <span className="text-gray-600">→</span>}
            </div>
          ))}
        </div>
        <p className="text-gray-500 text-sm mt-3">
          Imagens sao geradas e aprovadas antes do video. Controle total sobre cada etapa.
        </p>
      </div>
    </div>
  );
}
