<div align="center">
<img src="admin/public/project_nomad_logo.webp" width="200" height="200" alt="Project NOMAD logo"/>

# Project NOMAD: MacOS Unleashed

An Apple Silicon overlay for [Project NOMAD](https://github.com/Crosstalk-Solutions/project-nomad)

</div>

This branch contains only the changes needed to build and operate Project NOMAD locally on an
Apple Silicon Mac, plus two usability fixes discovered during that work. It is a community fork and
is not an officially supported upstream installation target.

For the project overview, capabilities, security model, application catalog, FAQ, licensing, and
general documentation, use the
[original Project NOMAD repository](https://github.com/Crosstalk-Solutions/project-nomad#readme).
This README describes only the macOS overlay.

## Overlay changes

| Area | Difference from upstream |
|---|---|
| Host platform | Builds the Command Center as a native Linux ARM64 image under Docker Desktop on Apple Silicon. |
| Core deployment | Adds `compose.macos.yml` for the Command Center, MySQL, and Redis without the Debian installer or `systemd`. |
| Local operations | Adds `nomad-mac` commands for building, starting, rebuilding, stopping, and inspecting the stack. |
| Persistent data | Stores databases, downloads, maps, books, and application data beneath a user-selected macOS directory. |
| Local AI | Supports native macOS Ollama and authenticated OpenAI-compatible servers such as Unsloth Studio. |
| Offline maps | Adds a downloaded-region picker and uses each PMTiles archive's geographic bounds to navigate to the selected region. |
| Map descriptions | Clarifies that supplied PMTiles archives are vector basemaps, not contour or hillshade topographic maps. |

The AI authentication and map navigation changes are platform-independent. The map fix is also
proposed to upstream in
[Crosstalk-Solutions/project-nomad#1355](https://github.com/Crosstalk-Solutions/project-nomad/pull/1355).

## Quick start

Requirements:

- An Apple Silicon Mac
- Docker Desktop with Docker Compose
- Git
- At least 8 GB assigned to Docker Desktop; more is helpful when running optional applications

Clone this branch:

```bash
git clone --branch MacOS-Unleashed https://github.com/sundruid/project-nomad.git
cd project-nomad
```

Create and secure the local environment file:

```bash
cp macos.env.example .env
chmod 600 .env
```

Edit `.env`, replace each `CHANGE_ME` value, and set `NOMAD_DATA_DIR` to an absolute path outside
the repository. Then build and start the ARM64 stack:

```bash
./nomad-mac start
```

Open <http://127.0.0.1:8080>.

See [MACOS-LOCAL.md](MACOS-LOCAL.md) for the complete installation, AI configuration, backup,
update, troubleshooting, and recovery procedures.

## macOS helper

```text
./nomad-mac build       Build the local ARM64 Command Center image
./nomad-mac start       Build if needed and start the core stack
./nomad-mac rebuild     Rebuild and recreate the core containers
./nomad-mac status      Show core container status and health
./nomad-mac logs        Follow Command Center logs
./nomad-mac logs mysql  Follow logs for one core service
./nomad-mac stop        Stop the core containers
./nomad-mac down        Remove containers and network; persistent data remains
```

Do not use upstream's Debian installation script on macOS. It depends on `apt`, `systemd`, root
installation paths, and Linux host behavior that Docker Desktop does not provide.

## Native AI delta

Running Ollama, Unsloth Studio, or another model server directly on macOS preserves Apple Metal
acceleration. The Dockerized Command Center reaches the native server through
`host.docker.internal`.

For an authenticated Unsloth Studio endpoint, set the key only in the ignored `.env` file:

```dotenv
NOMAD_REMOTE_AI_API_KEY=your-local-api-key
```

Then configure the AI Assistant remote URL in NOMAD as:

```text
http://host.docker.internal:8888
```

The overlay sends the key as a server-side bearer token for model discovery and chat requests. It
does not return the key to the browser or save it in NOMAD's settings database. Leave the variable
blank when using an unauthenticated Ollama endpoint.

## Compatibility boundary

The following are intentional differences or current limitations of this overlay:

- The Command Center, MySQL, Redis, Kiwix, Qdrant, and Calibre-Web have been exercised on Apple
  Silicon. The complete optional application catalog has not been verified.
- The Linux updater sidecar, host disk collector, and Dozzle are omitted from the core macOS stack.
- Docker containers cannot use the Mac's Metal GPU, so local model servers should run natively.
- AI chat works with Unsloth Studio, but document RAG also requires a compatible embedding model or
  endpoint. A chat model alone does not populate Qdrant vectors.
- Some third-party images may be AMD64-only and will require emulation or an ARM64 alternative.
- Upstream Creator Packs and other gated services may require infrastructure or credentials not
  distributed with the public source tree.
- The default Compose binding is loopback-only. Changing it to a LAN-facing address also changes
  the security exposure; Project NOMAD does not provide built-in user authentication.

## Files added by the overlay

- `compose.macos.yml` — minimal ARM64 core stack
- `macos.env.example` — secret-free environment template
- `nomad-mac` — local lifecycle helper
- `MACOS-LOCAL.md` — detailed macOS installation and operations guide
- `admin/app/utils/remote_ai_auth.ts` — optional server-side remote-AI bearer authentication
- `admin/tests/unit/remote_ai_auth.spec.ts` — authentication-header tests

All other foundational Project NOMAD documentation and source context should be read from the
[upstream repository](https://github.com/Crosstalk-Solutions/project-nomad).

## Branch policy

`MacOS-Unleashed` is the default branch of this fork. It carries the macOS overlay on top of the
upstream Project NOMAD source. Upstream contributions should remain narrowly scoped so they can be
reviewed independently of the macOS deployment files.

Project NOMAD remains licensed under the upstream [Apache License 2.0](LICENSE).
