import type { CaptionTrack } from "@/types";

const en = (videoId: string, lines: [string, string, string][]): CaptionTrack => ({
  id: `cap-${videoId}-en`,
  videoId,
  language: "English",
  status: "generated",
  entries: lines.map(([start, end, text], i) => ({ id: `c${i + 1}`, start, end, text })),
});

const fr = (videoId: string, lines: [string, string, string][]): CaptionTrack => ({
  id: `cap-${videoId}-fr`,
  videoId,
  language: "French",
  status: "generated",
  entries: lines.map(([start, end, text], i) => ({ id: `c${i + 1}`, start, end, text })),
});

export const captionTracks: CaptionTrack[] = [
  en("vid-natural-light", [
    ["00:00:01.000", "00:00:04.500", "Window light is the cheapest crew member you will ever hire."],
    ["00:00:04.800", "00:00:08.200", "It is also the one most likely to walk out without notice."],
    ["00:00:09.000", "00:00:13.400", "Start by reading the room at the hour you plan to shoot."],
    ["00:00:13.900", "00:00:18.000", "North-facing windows give you soft, honest light all day."],
    ["00:00:18.500", "00:00:23.000", "East or west, and you are now negotiating with the sun's schedule."],
    ["00:00:24.000", "00:00:28.500", "A bounce card is not cheating. It is diplomacy."],
    ["00:00:29.000", "00:00:33.800", "Half of interview lighting is protecting your subject from their own shadows."],
    ["00:00:34.500", "00:00:39.000", "Set your exposure for the face, then let the room fall where it falls."],
    ["00:00:40.000", "00:00:44.200", "If the light moves during the take, let it. Cut around it later."],
    ["00:00:45.000", "00:00:49.500", "And when in doubt: wait ten minutes. The room will look different."],
  ]),
  fr("vid-natural-light", [
    ["00:00:01.000", "00:00:04.500", "La lumière naturelle est le membre d'équipe le moins cher que vous engagerez."],
    ["00:00:04.800", "00:00:08.200", "C'est aussi celle qui risque le plus de partir sans prévenir."],
    ["00:00:09.000", "00:00:13.400", "Commencez par lire la pièce à l'heure où vous comptez tourner."],
    ["00:00:13.900", "00:00:18.000", "Les fenêtres au nord offrent une lumière douce et honnête toute la journée."],
    ["00:00:18.500", "00:00:23.000", "À l'est ou à l'ouest, vous négociez avec l'horaire du soleil."],
    ["00:00:24.000", "00:00:28.500", "Un réflecteur n'est pas de la triche. C'est de la diplomatie."],
    ["00:00:29.000", "00:00:33.800", "La moitié de l'éclairage d'entretien protège le sujet de ses propres ombres."],
    ["00:00:34.500", "00:00:39.000", "Réglez l'exposition sur le visage, laissez le reste tomber où il veut."],
    ["00:00:40.000", "00:00:44.200", "Si la lumière bouge pendant la prise, laissez-la. Coupez plus tard."],
    ["00:00:45.000", "00:00:49.500", "Et en cas de doute : attendez dix minutes. La pièce sera différente."],
  ]),
  en("vid-sound-quiet-rooms", [
    ["00:00:01.000", "00:00:05.000", "Quiet rooms are not silent. They are specific."],
    ["00:00:05.500", "00:00:10.000", "Record thirty seconds of room tone before anyone speaks."],
    ["00:00:10.500", "00:00:15.000", "Close the fridge. Tell the radiator. Apologise to the lighthouse."],
  ]),
];

export function captionsForVideo(videoId: string): CaptionTrack[] {
  return captionTracks.filter((t) => t.videoId === videoId);
}
