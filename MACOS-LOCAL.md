# Project NOMAD: MacOS Unleashed

MacOS Unleashed is a community Apple Silicon adaptation of Project NOMAD. It keeps the upstream
application and browser experience while replacing the Debian host installer with a small,
reproducible Docker Desktop stack.

This branch is useful when you want NOMAD on an M-series Mac and accept that some Linux host
integration and optional applications remain unavailable or unverified. It is not officially
supported by the upstream project.

## What this branch adds

- A native Linux ARM64 build of the Project NOMAD Command Center.
- A minimal Docker Compose stack containing the Command Center, MySQL, and Redis.
- Persistent storage in a user-selected macOS directory.
- A `nomad-mac` helper for building, starting, stopping, rebuilding, and viewing logs.
- Optional bearer authentication for remote OpenAI-compatible AI servers.
- Verified integration with a native Unsloth Studio server on macOS.
- A downloaded-region selector for offline maps. It reads each PMTiles archive's bounds and moves
  directly to the selected state, country, or custom extract.
- Accurate Maps Manager wording: the supplied archives are vector basemaps with streets,
  buildings, and places, not contour or hillshade topographic maps.

The remote AI authentication and map navigation changes are platform-independent, but are included
here because they were necessary to make this installation useful.

## Architecture

| Component | Where it runs | Purpose |
|---|---|---|
| Command Center | Docker Desktop, ARM64 | NOMAD web UI, API, jobs, downloads, and app orchestration |
| MySQL 8 | Docker Desktop, ARM64 | Application database |
| Redis 7 | Docker Desktop, ARM64 | Queues, scheduled jobs, and live events |
| Docker socket | Mounted into Command Center | Installs and manages optional NOMAD applications |
| Unsloth Studio or Ollama | Native macOS, recommended | Metal-accelerated local AI |
| Qdrant | Optional Docker application | Vector storage for document retrieval |
| Kiwix, Calibre-Web, Kolibri, and utilities | Optional Docker applications | Offline content and tools |

The core UI is published only on `127.0.0.1` by default. Persistent files live under
`NOMAD_DATA_DIR`, outside the containers.

## Requirements

- An Apple Silicon Mac.
- Docker Desktop with the Compose plugin enabled.
- Git.
- At least 8 GB assigned to Docker Desktop. More memory is recommended if several optional apps run
  together.
- Sufficient SSD space for the content you choose. Regional maps, ZIM archives, models, and media
  can consume hundreds of gigabytes.

The Docker VM does not have access to Apple's Metal GPU. Run AI software natively on macOS for GPU
acceleration.

## Quick start

Clone this fork and select the macOS branch:

```bash
git clone --branch MacOS-Unleashed https://github.com/sundruid/project-nomad.git
cd project-nomad
```

Create the local environment file:

```bash
cp macos.env.example .env
chmod 600 .env
```

Edit `.env` and replace every `CHANGE_ME` value. `NOMAD_DATA_DIR` must be an absolute path to a
directory where NOMAD may keep its database, downloads, books, maps, and optional app data. Generate
strong application and database secrets with a password manager or `openssl rand -hex 32`.

Build and start NOMAD:

```bash
./nomad-mac start
```

Open <http://127.0.0.1:8080>. The first ARM64 build can take several minutes; later builds reuse the
Docker cache.

## Helper commands

```bash
./nomad-mac build       # build the ARM64 Command Center image
./nomad-mac start       # build when needed, then start the core stack
./nomad-mac rebuild     # rebuild and recreate the core containers
./nomad-mac status      # show core container status and health
./nomad-mac logs        # follow Command Center logs
./nomad-mac logs mysql  # follow one core service
./nomad-mac stop        # stop containers without deleting them
./nomad-mac down        # remove core containers/network; persistent data remains
```

Do not run the upstream `install/install_nomad.sh` on macOS. It expects Debian, `apt`, `systemd`,
root access, Linux mount propagation, and upstream deployment assumptions.

## Native AI configuration

### Unsloth Studio

Unsloth Studio can provide the chat model while running natively with Apple acceleration.

1. Start Unsloth Studio's API server on macOS. Port `8888` was used for the verified setup.
2. Create an Unsloth API key and place it only in the ignored `.env` file:

   ```dotenv
   NOMAD_REMOTE_AI_API_KEY=your-local-unsloth-api-key
   ```

3. Recreate the Command Center after changing `.env`:

   ```bash
   ./nomad-mac rebuild
   ```

4. In **Settings -> AI Assistant**, configure the remote URL as:

   ```text
   http://host.docker.internal:8888
   ```

5. Load a local chat model in Unsloth. Enabling Unsloth's OpenAI model auto-switch setting lets a
   NOMAD request reload the selected model after it has been unloaded or after Unsloth restarts.

The API key remains server-side. It is not written to NOMAD's database and is not returned to the
browser. Leaving `NOMAD_REMOTE_AI_API_KEY` empty preserves compatibility with unauthenticated
Ollama, LM Studio, and llama.cpp endpoints.

NOMAD still identifies this feature internally as Ollama, so the dashboard may report the managed
`nomad_ollama` container as unknown even while the remote Unsloth connection and chat are healthy.
Ollama-specific model pulling, process listing, and unload controls do not apply to Unsloth.

### Ollama

Native Ollama remains the most compatible AI backend because NOMAD can use its chat, embedding,
model download, and process APIs. Start Ollama so Docker can reach it, then configure:

```text
http://host.docker.internal:11434
```

Do not use `127.0.0.1` in NOMAD's remote URL: from the Command Center container that address refers
to the container itself, not the Mac.

### Document retrieval and embeddings

Chat and document retrieval are separate capabilities. A chat-only Unsloth configuration can answer
questions, but NOMAD's current RAG workflow also requests an embedding model such as
`nomic-embed-text:v1.5`. Qdrant may be running while containing zero vectors if that embedding model
is unavailable.

For full RAG today, use an AI backend that serves NOMAD's requested embedding model. A future branch
improvement could add independent chat and embedding endpoint settings.

## Offline maps

The map page includes **Jump to downloaded region**. The selector:

- Lists the PMTiles archives already stored by NOMAD.
- Turns filenames into readable, alphabetized labels.
- Reads the selected archive's own geographic bounds in the browser.
- Fits the map to those bounds without hard-coded state or country coordinates.
- Works with curated state archives and future country/custom extracts.

The small world basemap covers zoom levels 0-5 and is intentionally low detail. Regional archives
contain streets, buildings, and points of interest through their configured maximum zoom. Select a
downloaded region and zoom further for local detail.

The current curated PMTiles files contain no elevation model, contours, hillshade, or satellite
imagery. Describing them as fully topographic would be inaccurate.

## Verified status

The following was verified on an Apple Silicon development Mac on 2026-09-21:

| Capability | Status | Notes |
|---|---|---|
| Command Center/API | Working | ARM64 production build; health endpoint passes |
| MySQL and Redis | Working | Persistent native ARM64 containers |
| Docker app orchestration | Working | Used to install Kiwix, Calibre-Web, and Qdrant |
| Offline maps | Working | Thirteen regional archives plus world overview tested |
| Unsloth chat | Working | Authenticated model discovery, chat, and auto-reload tested |
| Kiwix | Working | Server and installed ZIM archives tested |
| Calibre-Web | Working, content-dependent | Server works; books must be imported separately |
| Qdrant | Working, content-dependent | Vector service works; useful only after successful embedding |
| Built-in documentation | Working | Served from the Command Center |
| Drug reference | Not installed in the verified setup | Requires its separate content download and ingest |
| Kolibri, CyberChef, Notes, and other catalog apps | Not installed or not end-to-end tested | Install only what you need and verify each app |

This table reports the verified development system, not a promise that every optional application
will work on every Mac.

## Deliberate omissions and limitations

- **Official support:** upstream officially targets Debian-based Linux. This branch is community
  maintained.
- **Core updater sidecar:** omitted. It could replace the local ARM64 image with an incompatible
  upstream image. Update this branch manually and rebuild.
- **Disk collector:** omitted because its Linux host-root `rslave` mount does not translate to Docker
  Desktop. Hardware and disk information in the UI may describe the Docker VM or be incomplete.
- **Dozzle:** omitted. Use Docker Desktop or `./nomad-mac logs`.
- **Apple GPU reporting:** the Command Center container cannot see the Apple GPU. Native AI can still
  use Metal.
- **Creator Packs:** unavailable in a source build because the official build injects an entitlement
  key that is not present in the public repository.
- **Excalidraw:** the pinned catalog image inspected during development was AMD64-only and requires
  emulation.
- **Node version warnings:** the upstream lockfile includes packages that declare newer Node
  requirements than the Dockerfile's Node version. The production build passes, but this should be
  rechecked after upstream dependency updates.
- **Optional apps:** an image publishing ARM64 does not prove every application workflow works on
  macOS. Treat untested catalog apps as unverified.

## Security and network exposure

Project NOMAD currently has no Command Center authentication. The macOS compose file therefore binds
the core UI to `127.0.0.1` only.

Optional applications installed through the Supply Depot may publish ports on all host interfaces.
Review Docker Desktop, macOS firewall, and LAN exposure after each installation. Do not expose NOMAD
directly to the internet without adding an appropriate authentication and reverse-proxy layer.

Keep `.env` private. It is excluded from Git and the Docker build context. Never commit API keys,
application keys, database passwords, downloaded content, or the `NOMAD_DATA_DIR` tree.

## Persistent data and backups

`./nomad-mac down` removes containers and the Compose network but not the bind-mounted data directory.
The configured `NOMAD_DATA_DIR` contains the database, map archives, ZIM files, books, and optional
application state.

For a consistent backup:

1. Run `./nomad-mac stop`.
2. Back up the entire `NOMAD_DATA_DIR` directory with your preferred macOS backup tool.
3. Run `./nomad-mac start`.

Do not copy live MySQL files while the database is actively writing unless your backup tool provides
filesystem-consistent snapshots.

## Updating the branch

Commit or stash your own work first, then:

```bash
git pull --ff-only
./nomad-mac rebuild
```

Core automatic updates should remain disabled on this branch. Content and optional-app updates are
separate features, but should be enabled only after the relevant application has been verified on
your Mac.

## Troubleshooting

### Command Center does not open

```bash
./nomad-mac status
./nomad-mac logs
```

Confirm Docker Desktop is running, port 8080 is available, `.env` exists, and `NOMAD_DATA_DIR` is an
absolute writable path.

### Remote AI is disconnected

- Confirm the native AI server is running and listening on the configured port.
- Use `host.docker.internal`, not `127.0.0.1`, in NOMAD's remote URL.
- Confirm the API key in `.env` matches the server and rebuild after changing it.
- Confirm a chat model is loaded or enable the server's model auto-switch behavior.

### AI chat works but documents are not retrieved

Check whether the backend supplies the requested embedding model and whether Qdrant contains vectors.
Chat success alone does not prove RAG indexing is operational.

### Maps look empty

Use **Jump to downloaded region**, select an installed archive, and zoom in. The world overview is
only a low-zoom navigation layer. If a region still fails, confirm its `.pmtiles` file completed and
that the browser receives HTTP byte-range responses.

### An optional app fails to start

Inspect its architecture and logs in Docker Desktop. Some catalog images may be AMD64-only or may
expect Linux host capabilities that Docker Desktop does not expose.

## Branch maintenance

The intended default branch in this fork is `MacOS-Unleashed`. Keep platform-independent fixes small
and submit them upstream when practical, while retaining Docker Desktop-specific deployment files and
documentation in this branch.
