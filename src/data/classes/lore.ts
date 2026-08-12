/**
 * Class prose, straight from the campaign wiki's "Lista de Classes".
 *
 * Kept apart from the class definitions so the mechanical files stay readable:
 * those carry dice, proficiencies and techniques, this one carries the voice.
 * `summary` is the one-line concept; `text` is the first-person page a player
 * reads before committing to the vocation.
 */
export interface ClassLore {
  summary: string
  text?: string
}

export const CLASS_LORE: Record<string, ClassLore> = {
  warrior: {
    summary:
      'Ser um Guerreiro aqui é aceitar ser humano até o fim — e, mesmo assim, escolher enfrentar o sobrenatural de olhos abertos, arma em punho, sabendo que coragem, por si só, pode não ser suficiente… mas é tudo o que tenho.',
    text: 'Não nasci com dons estranhos nem ouço sussurros de deuses. O que tenho são mãos calejadas, um corpo treinado e a decisão — repetida todos os dias — de não recuar. Na Terra das Brumas, isso já me torna diferente.\n\nJá fui muitas coisas, dependendo da terra: cavaleiro juramentado, soldado em fileiras que fediam a sangue e medo, guarda de estrada, camponês que aprendeu a segurar uma lança porque ninguém mais iria proteger o que era seu. Aqui, a lâmina não pergunta por sua origem. Ela apenas precisa estar firme.\n\nNão luto por curiosidade arcana ou promessas divinas. Luto por razões simples: justiça que não veio, vingança que não esfriou, um nome a defender, um futuro que precisa ser conquistado à força. Fama e fortuna são mentiras úteis; às vezes, a única coisa real é continuar em pé.\n\nSei que há horrores contra os quais aço não basta. Já vi espadas atravessarem fantasmas como névoa e homens melhores que eu morrerem por não compreenderem isso a tempo. Ainda assim, quando a criatura avança e ninguém mais fica, sou eu quem permanece na linha de frente.',
  },
  thief: {
    summary:
      'Ser um Gatuno aqui é aceitar que a esperteza é a verdadeira arma contra o terror. Não enfrento monstros para provar coragem. Eu os engano, os evito ou os deixo presos — e sigo vivo para contar a história.',
    text: 'Escrevo rápido e em poucas linhas. Não por medo — por hábito. Em Ravenloft, quem pensa demais morre, e quem luta de frente costuma morrer ainda mais rápido. Eu sobrevivo porque escolho bem onde piso… e quando não piso.\n\nNão tenho dons sobrenaturais nem bênçãos ocultas. O que tenho é atenção aos detalhes, mãos hábeis e a certeza de que quase todo horror pode ser evitado se você encontrar a porta certa, a alavanca escondida ou a mentira adequada. Enquanto outros enfrentam salas cheias de mortos-vivos, eu prefiro não estar lá quando eles acordam.\n\nChamam-me de ladrão, mas já fui investigador, explorador de ruínas, cidadão comum que aprendeu a ler pessoas melhor do que livros. Em cidades onde a noite esconde segredos demais, saber ouvir, seguir pistas e desaparecer no momento certo vale mais do que qualquer espada encantada.\n\nNão me movo por ideais elevados. Quero saber o que ganho com isso — ouro, influência, respostas, ou a segurança de alguém que não pode se proteger sozinho. Às vezes, é vingança. Às vezes, é apenas a satisfação de resolver um mistério que ninguém mais conseguiu.',
  },
  wizard: {
    summary:
      'Ser um Mago aqui é calcular riscos com a própria essência, aceitar que cada conjuração é um mergulho em águas corrompidas — e ainda assim continuar, porque apenas o poder arcano pode enfrentar plenamente os horrores que espreitam além do medo humano.',
    text: 'Escrevo entre círculos de proteção mal apagados e anotações que prefiro não reler. Em Ravenloft, estudar magia não é apenas buscar conhecimento — é negociar, a cada dia, com a própria perdição. A arte arcana aqui corta para os dois lados, e eu sangro sempre que a empunho.\n\nCada feitiço lançado é uma escolha consciente. Alguns exigem mais do que gestos e palavras; exigem uma súplica velada às Potências Sombrias, um pedido que elas nunca deixam passar sem cobrar algo em troca. Usar necromancia ou tocar o Mal é arriscar a própria alma, mesmo quando o objetivo é deter horrores que riem do aço comum e da fé instável.\n\nMinha busca por saber nunca termina. Ruínas antigas, tomos proibidos, fragmentos de verdades planares — Ravenloft está repleto de segredos que imploram para ser descobertos, mesmo quando sei que alguns deles deveriam permanecer enterrados. O perigo não me afasta. Ele me atrai.\n\nAté meus companheiros mudaram. Meu familiar reflete este reino: uma sombra torcida da criatura que deveria ser, lembrando-me constantemente de onde estou e do que a magia aqui se torna.',
  },
  priest: {
    summary:
      'Na Terra das Brumas, ser um Clérigo não é sentir a presença divina — é sustentar a crença apesar de sua ausência, e carregar esperança para outros quando a própria fé ameaça ruir em silêncio.',
    text: 'Escrevo com as mãos ainda unidas em oração — não porque espero uma resposta, mas porque parar de rezar seria admitir o vazio. Em Ravenloft, os deuses são distantes. Silenciosos. Às vezes, terrivelmente ausentes. Ainda assim, sou clérigo, e isso significa permanecer quando o céu não responde.\n\nCuido dos fiéis porque alguém precisa fazê-lo. Protejo, aconselho, enterro os mortos e tento manter acesa uma chama que raramente aquece. Para os que nasceram aqui, esse silêncio sempre foi normal. Para mim — e para outros que vieram de fora — ele pesa como luto constante.\n\nAlguns dizem que os deuses nos abandonaram. Outros acreditam em um pacto não dito que os mantém afastados deste reino. Há ainda os que sussurram que nossas preces não sobem aos céus… são interceptadas por algo mais próximo, algo que escuta com atenção demais.\n\nMesmo assim, continuo. Cada milagre que realizo é um ato de fé sem confirmação, um passo no escuro confiando que não é a mão errada que responde.',
  },
  ranger: {
    summary:
      'Ser um Guardião aqui é viver na primeira linha do abismo: manter o equilíbrio não entre homem e natureza, mas entre a sobrevivência e aquilo que espreita logo além das árvores, esperando que alguém pare de vigiar.',
    text: 'Escrevo de um posto avançado que não aparece em mapas. Aqui, a estrada termina e a floresta começa a decidir quem volta. Esse é o limite que vigio. Não para domar a selva, mas para impedir que ela atravesse a última cerca.\n\nMeu dever não é o mesmo dos druidas. Eles escutam a terra; eu escuto os passos que se aproximam dela. Protejo vilas que não sobreviveriam a uma noite sozinhas, rastreio horrores antigos que aprenderam a caçar pessoas, e faço escolhas rápidas quando não há tempo para orações ou debates.\n\nJá fui caçador para alimentar meu clã, guarda-caças a serviço de nobres que nunca pisaram longe demais de seus salões, e patrulheiro nas florestas profundas onde criaturas malignas aprendem a temer meu rastro. Cada domínio exige um tipo diferente de vigilância. O erro é sempre o mesmo: acreditar que a mata está vazia.',
  },
  bard: {
    summary:
      'Ser um Bardo aqui é tecer sentido a partir de fragmentos, desafiar o isolamento com palavras, e apostar a própria vida na esperança de que alguém, em algum lugar além da névoa, ainda esteja ouvindo.',
    text: 'Escrevo sabendo que talvez estas palavras nunca atravessem as brumas. Ainda assim, escrevo. Na Terra das Brumas, isso já é um ato de desafio. Cada domínio é uma ilha de medo, cercada por silêncio e mentiras convenientes, e alguém precisa lembrar o que aconteceu antes que a verdade apodreça.\n\nSou chamado de cantor, contador de histórias, distração para noites longas demais. Poucos entendem que minha arte é sobrevivência. Carrego notícias onde elas são proibidas, nomes onde o esquecimento é imposto, e histórias que alguns preferiam ver enterradas. Cada canção é um mapa; cada verso, um aviso.\n\nViajar aqui é perigoso não apenas por causa dos monstros, mas porque a verdade não é bem-vinda. Já vi sorrisos se fecharem quando uma melodia revela demais. Já fugi não por mentir, mas por lembrar.',
  },
  monk: {
    summary:
      'Ser um Monge aqui é travar uma guerra silenciosa e interminável dentro de si mesmo — e saber que, se eu falhar, não me tornarei apenas um inimigo… mas um exemplo do que o terror faz com os que acreditam ser incorruptíveis.',
    text: 'Escrevo após a meditação, quando o corpo ainda está imóvel, mas a mente permanece alerta. Em Ravenloft, a corrupção não grita — ela sussurra. Oferece conforto, poder, alívio. Cada dia é uma prova, e cada recusa deixa marcas invisíveis mais profundas que qualquer ferida.\n\nMinha disciplina não é isolamento do mundo, mas resistência a ele. Treinei o corpo para obedecer, a respiração para acalmar o medo, e o espírito para não ceder às armadilhas adocicadas que prometem força ao custo da alma. Aqui, até a virtude pode ser distorcida se não for vigiada.\n\nQuando luto, não é apenas carne contra carne. Cada golpe carrega um princípio; cada movimento reafirma quem escolho ser.',
  },
  paladin: {
    summary:
      'Ser um Paladino aqui é vigiar não apenas o mundo, mas a si mesmo — pois, em Ravenloft, cair não significa falhar… significa servir às trevas acreditando ainda ser luz.',
    text: 'Eu não escolhi este caminho. Ele me encontrou. Em Ravenloft, isso me torna uma anomalia — um erro luminoso em um mundo que aprendeu a sobreviver sem esperança. Carrego um juramento que não nasceu do desejo, mas daquilo que viram em mim: uma pureza suficiente para suportar o peso da luz.\n\nOnde passo, sussurros seguem. Alguns se ajoelham. Outros se escondem. Minha presença é um farol, dizem… mas faróis também atraem tudo o que vive na escuridão.\n\nE eu sou absoluto. Vejo o bem e o mal com clareza dolorosa — ou assim preciso acreditar. Ainda assim, Ravenloft testa essa certeza todos os dias. Um vampiro não merece piedade. Um homem bêbado, violento e miserável… talvez mereça.\n\nMeu maior dom é também meu maior risco. A convicção que me sustenta pode se tornar soberba. Já vi o que acontece com paladinos que confundem justiça com orgulho: tornam-se ferramentas das Potências Sombrias.',
  },
  psionicist: {
    summary:
      'Ser um Psionicista aqui é viver sob suspeita constante, sabendo que cada pensamento é uma lâmina de dois gumes. Se eu vacilar, não serei consumido por monstros — mas por mim mesmo.',
    text: 'Escrevo em silêncio, como faço com tudo o que realmente importa. Na Terra das Brumas, a mente é o último refúgio — e também o primeiro a ruir. A minha, eu fortifiquei com disciplina, não com preces ou fórmulas. Não peço poder. Eu o imponho.\n\nDizem que sou tocado, que algo me quebrou por dentro. Talvez estejam certos. Aqui, pensar demais já é um risco. Não movo as mãos, não entoo palavras. Ainda assim, olhos desviam quando a dor floresce sem aviso, quando a vontade cede sem toque. Chamam isso de mau-olhado. Eu chamo de foco.\n\nJá vi magos perderem a razão quando a Trama os traiu. Já vi clérigos implorarem a deuses que não responderam. Eu confio apenas naquilo que ninguém pode me tirar.',
  },
  artificer: {
    summary:
      'Ser um Artífice aqui é insistir em acender uma faísca de lógica em um mundo que prefere a escuridão — mesmo sabendo que, um dia, essa luz pode revelar o quão monstruoso eu me tornei.',
  },
  barbarian: {
    summary:
      'Ser um Bárbaro aqui é ser a última muralha entre o horror e aquilo que ainda vale a pena proteger — mesmo que, aos olhos do mundo, eu pareça apenas mais uma fera gritando na noite.',
    text: 'Nas terras que se dizem civilizadas, chamam-me de selvagem, de bêbado, de fera à solta. Deixo que pensem assim. É mais seguro para eles.\n\nVenho de lugares onde a floresta observa, onde a noite tem dentes e onde apenas os fortes sobrevivem ao inverno — ou ao que rasteja depois do pôr do sol. Minha fúria não é loucura: é memória. Cada golpe carrega o peso dos que caíram tentando proteger seu lar, sua tribo, seu sangue.\n\nNessas terras, aprendi que monstros usam muitas formas. Alguns uivam na escuridão. Outros vestem boas roupas e constroem muros. Eu enfrento ambos do mesmo modo: com os pés firmes na terra e o coração em chamas.',
  },
  druid: {
    summary:
      'Ser um Druida aqui é travar uma guerra silenciosa e antiga: arrancar o antinatural pela raiz, restaurar um equilíbrio que talvez nunca tenha existido plenamente, e aceitar que, em Ravenloft, até a própria natureza luta para não se tornar um monstro.',
    text: 'Escrevo com terra sob as unhas e o cheiro de folhas mortas nas mãos. Não sirvo a deuses de nomes distantes. Minha fé nasce do solo, da seiva, do ciclo que insiste em continuar mesmo aqui, onde tudo parece apodrecer antes do tempo.\n\nNa Terra das Brumas, a natureza sofre. A floresta sussurra com dor, os rios carregam memórias ruins, e a terra está doente. Há lugares onde o mal se infiltra como um veneno lento, criando feridas que chamamos de sumidouros de maldade. Não posso ignorá-los.\n\nSou visto como pagão, como supersticioso, às vezes como cúmplice das feras que caçam à noite. Que seja. Alguém precisa vigiar os ermos quando as vilas fecham suas portas.',
  },
  'plague-doctor': {
    summary:
      'Ser um Médico da Praga em Ravenloft é aceitar que a ciência é uma lâmina cega, mas necessária — e que, às vezes, para afastar a morte, é preciso primeiro encará-la de perto, sem piscar, através de um bico vazio.',
    text: 'Escrevo com as mãos manchadas por coisas que não saem com água. Em Ravenloft, a cura não vem do céu — vem tarde, dolorosa e quase sempre acompanhada de escolhas irreversíveis. Sou chamado quando as preces falham ou nunca foram respondidas.\n\nUso couro encerado para manter a morte à distância e uma máscara cheia de ervas para enganar os miasmas que apodrecem o ar. Para alguns, sou sinal de esperança. Para outros, o aviso de que alguém não verá o próximo amanhecer. Ambos estão certos.\n\nConheço a carne por dentro. Sei onde cortar, quando drenar, o que remover para salvar o que resta. Não há elegância nisso — apenas sobrevivência.',
  },
  sorcerer: {
    summary:
      'Você não estudou magia — nasceu queimando com ela. Onde magos extraem feitiços de livros, você os arranca crus do próprio sangue.',
    text: 'Cada conjuração é uma aposta entre o brilhantismo e a catástrofe.',
  },
  warlock: {
    summary:
      'Ser um Warlock aqui é caminhar sabendo que a queda já começou — e decidir, todos os dias, se o poder que me foi dado servirá para aprofundar as trevas… ou para feri-las antes que me reclamem por completo.',
    text: 'Não escrevo para pedir absolvição. Escrevo porque o silêncio pesa mais quando se sabe quem está ouvindo. Em Ravenloft, todo poder cobra seu preço — e eu aceitei pagar antes que o mundo terminasse de me tirar tudo.\n\nNão estudei anos nem esperei respostas divinas que nunca chegam. Olhei para a escuridão e ela olhou de volta. O pacto não foi uma barganha justa; foi um convite sussurrado, feito pelas mesmas forças que mantêm este reino respirando horror. Minha alma saiu marcada. Eu sabia disso. Assinei mesmo assim.\n\nCarrego marcas que não se apagam e uma voz que nunca se cala. Cada feitiço reforça o laço. Cada vitória torna o fim mais próximo.',
  },
  witch: {
    summary:
      'Ser uma Bruxa em Ravenloft é viver à margem, temida por todos e procurada em segredo. Sou remédio e veneno, bênção e sentença.',
    text: 'Escrevo sabendo que meu nome jamais será dito em voz alta. Aqui, "bruxa" é palavra de medo — cuspida com o mesmo desprezo usado para monstros que devoram crianças. Para o camponês, não há diferença entre mim e uma megera escondida nas colinas. O medo não distingue.\n\nNão pertenço a igrejas nem a academias. Meu saber vem da Trama, de tradições antigas sussurradas à noite, de espíritos que conhecem esta terra melhor do que qualquer sacerdote. Aprendi com ervas, com sangue, com a intenção certa no momento exato.\n\nSou mestra de poções, encantos e maldições — e é isso que realmente os apavora. Milagres podem ser negados. Feitiços exigem estudo. Uma maldição bem lançada apenas acontece.',
  },
  commoner: {
    summary:
      'Você ainda não é ninguém. Sobreviva à primeira aventura e o mundo passa a ter uma opinião a seu respeito.',
  },
}

export function getClassLore(classId: string): ClassLore | undefined {
  return CLASS_LORE[classId]
}
