import { renderInfoArticlesCollection } from '../components/InfoArticlesCollection.js';

const infos = [
  {
    id: 'info-bun',
    title: 'Comment choisir un bun',
    summary: 'Un bun moelleux qui reste stable avec la sauce aide a garder un burger propre a manger.',
    content: [
      'Choisis un bun legerement brioché avec une mie serrée: il absorbe un peu de jus sans se desintegrer.',
      'Toaste la face interieure 30 a 60 secondes pour creer une barriere contre l humidite des sauces.',
      'Si ton burger est tres garni, prefere un bun de diametre un peu plus large pour garder un montage stable.'
    ]
  },
  {
    id: 'info-cuisson-steak',
    title: 'Cuisson du steak',
    summary: 'Une plaque tres chaude et un temps court donnent une bonne croute et un coeur juteux.',
    content: [
      'Utilise une plaque ou poele en fonte prechauffee a feu fort pour obtenir une vraie reaction de Maillard.',
      'Forme des boules de viande de 90 a 120 g puis ecrase-les a la premiere seconde de cuisson.',
      'Sale juste apres la formation de la galette et retourne quand la croute est bien brune, sans multiplier les retournements.'
    ]
  },
  {
    id: 'info-ordre-montage',
    title: 'Ordre de montage',
    summary: 'Base sauce, salade, steak et toppings: cet ordre limite l humidite sur le pain du bas.',
    content: [
      'Pose une couche fine de sauce sur le pain du bas, puis un element sec comme salade ou pickles egouttes.',
      'Ajoute ensuite le steak et le fromage pour fixer la structure chaude au centre du burger.',
      'Termine avec les toppings humides plus haut dans le montage pour eviter de detremper la base.'
    ]
  },
  {
    id: 'info-sauces-equilibre',
    title: 'Sauces et equilibre',
    summary: 'Reste sur une sauce principale puis un accent acidule pour eviter un burger trop lourd.',
    content: [
      'Garde une sauce principale (mayo, burger sauce, moutarde douce) et ajoute un seul contrepoint acide.',
      'Un trait de pickles, oignons vinaigres ou citron suffit souvent a redonner de la fraicheur.',
      'Dose progressivement: trop de sauce masque la viande et rend la prise en main moins propre.'
    ]
  }
];

export function initInfosController({
  target,
  infoReader,
  onRouteUpdate = null
}) {
  const infoItemsById = new Map(infos.map((item) => [item.id, item]));

  renderInfoArticlesCollection({
    items: infos,
    target,
    onArticleOpen: (item) => {
      infoReader.open(item);
      if (typeof onRouteUpdate === 'function') {
        onRouteUpdate({
          tab: 'infos',
          item: { type: 'info', id: item.id }
        });
      }
    }
  });

  return {
    getInfoItemsById: () => infoItemsById
  };
}
