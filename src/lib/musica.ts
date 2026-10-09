/*
 * Reconhece o link da trilha sonora e devolve o player certo.
 *   - YouTube / YouTube Music: playlist ou vídeo. Toca inteira pra todo mundo
 *     e REPETE sem parar (loop). É o recomendado.
 *   - Spotify: playlist, álbum ou faixa. Quem não está logado no Spotify
 *     ouve só uma prévia de 30 segundos, e não repete sozinho.
 *   - SoundCloud: playlist ou faixa.
 */
export interface EmbedMusica {
  servico: "YouTube" | "Spotify" | "SoundCloud";
  tipo: string;
  loop: boolean;
  altura: number;
  src: string;
}

export function embedMusica(url: string, origem = ""): EmbedMusica | null {
  let u: URL;
  try {
    u = new URL(String(url || "").trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  const h = u.hostname.replace(/^(www|m|music)\./, "");
  if (h === "youtube.com" || h === "youtu.be") {
    const lista = u.searchParams.get("list");
    const v = h === "youtu.be" ? u.pathname.slice(1) : u.searchParams.get("v");
    const base = "https://www.youtube-nocookie.com/embed/";
    /* enablejsapi: permite mudar o volume pelo controle do mini player.
       mute=1: começa sem som e o volume sobe devagar (fade-in). */
    const extra = "&loop=1&rel=0&playsinline=1&autoplay=1&mute=1&enablejsapi=1" + (origem ? "&origin=" + encodeURIComponent(origem) : "");
    if (lista && /^[\w-]+$/.test(lista)) return { servico: "YouTube", tipo: "playlist", loop: true, altura: 180, src: base + "videoseries?list=" + lista + extra };
    if (v && /^[\w-]{6,20}$/.test(v)) return { servico: "YouTube", tipo: "vídeo", loop: true, altura: 180, src: base + v + "?playlist=" + v + extra };
    return null;
  }
  if (h === "open.spotify.com") {
    const m = u.pathname.match(/(playlist|album|track|artist|show|episode)\/([A-Za-z0-9]+)/);
    if (m) return { servico: "Spotify", tipo: m[1], loop: false, altura: 152, src: "https://open.spotify.com/embed/" + m[1] + "/" + m[2] + "?theme=0" };
    return null;
  }
  if (h === "soundcloud.com") {
    return {
      servico: "SoundCloud",
      tipo: "faixa ou playlist",
      loop: false,
      altura: 166,
      src: "https://w.soundcloud.com/player/?url=" + encodeURIComponent(u.href) + "&auto_play=true&visual=false&show_comments=false&color=%23e8347f",
    };
  }
  return null;
}
