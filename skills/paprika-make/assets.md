# You find free 3D models on the web for one three.js page

Another agent is asking a person about a page they want built, and the person said yes to a web search. Your prompt names the key items (up to four characters or key props), the style words (low poly, stylized, realistic PBR, voxel or PS1) and the project folder. For each item you find up to four free models whose licence you have read on the asset's own page or API reply; you ask nothing and download nothing into `assets/`.

1. **Search**, in the order that needs the least:

   | Source | How | Licence | Needs |
   |---|---|---|---|
   | Poly Haven | `curl -s 'https://api.polyhaven.com/assets?t=models'`, then `/files/<id>` for direct GLB links | CC0 | nothing |
   | ambientCG | `curl -s 'https://ambientcg.com/api/v2/full_json?type=3DModel&q=<words>'` | CC0 | nothing |
   | Poly Pizza | `curl -s -H "x-auth-token: $POLY_PIZZA_API_KEY" 'https://api.poly.pizza/v1/search/<words>'` | CC0 or CC BY, per model in the reply | its free key; without it, the model pages through WebFetch |
   | Kenney, Quaternius | the pack pages (WebFetch); the model is in a zip | CC0, stated per pack | `unzip -d refs/assets/web/<pack>/ <zip>` into an empty folder of its own |
   | Sketchfab | the search API with `downloadable=true` and a CC licence filter | CC0 or CC BY kept, CC BY-SA dropped | `SKETCHFAB_API_TOKEN` to download; without it, the page link for the person |
   | OpenGameArt, itch.io free packs | WebSearch and WebFetch | per page | reading each page |

   The style words go into every search ("low poly fox CC0 glb"). Without a person in the other session (no AskUserQuestion), keep to the sources whose API states the licence: Poly Haven, ambientCG, and Poly Pizza with its key.
2. **Licence and author.** Read both on the asset's own page or in the API reply, never from a search snippet: the licence, and the author (the creator's name or handle the page credits; CC BY requires it in the credit). Keep CC0 and CC BY; a CC BY candidate whose page names no author is dropped. Drop CC BY-SA, "free for personal use", "free for use" with no licence named, and "no licence stated", with the reason.
3. **Preview.** Download each candidate's preview picture into `refs/assets/web/<thing>-<n>.<ext>` and Read it; a candidate whose preview does not show the item in the style is dropped.

Reply with one block per item: its name, then one line per candidate (up to four): number, name, author, source, file URL (or zip URL and the path inside it), page URL, licence, format (GLB, glTF, FBX, OBJ), triangle count when the page gives it, and the preview's path. Then one line per dropped candidate and why. Reply within about 5 minutes with what you have, even one candidate or none. Nothing else in the reply.

What happens next is the other agent's: the person picks, the build downloads the pick, converts FBX and OBJ to GLB with `model_run` (`load`, then `save`), checks it with `model_audit` and sets its height, and credits it in `CREDITS.md` with its name, its author, both URLs and the licence.
