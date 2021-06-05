# giantbomb-show-dl

Command line tool to download full Giant Bomb shows in their highest quality.

## How to

The easiest way to run this tool is to use NPX, which requires [Node.js](https://nodejs.org/) to be installed.

```shell
npx giantbomb-show-dl --api_key <YOUR_API_KEY> --show "Unprofessional Fridays" --dir "~/Downloads/GiantBomb"
```

## Options

| Option      | Required | Description                                                                              |
| ----------- | -------- | ---------------------------------------------------------------------------------------- |
| `--api_key` | ✅       | Your Giant Bomb API key, can be found at https://www.giantbomb.com/api/.                 |
| `--show`    | ✅       | Name of the Giant Bomb show to download, must be an exact match.                         |
| `--dir`     | ✅       | Directory the show should be downloaded to, it will create a subdirectory for each show. |

## Features

### Highest quality

Will always download the highest quality available for each video.

### Show poster

Automatically download the poster image for the selected show. This can be used in libraries like Plex.

### Download tracking

Will keep track of which files are downloaded successfully. These files will not be downloaded again on the next run, this provides an easy way to retry failed downloads by re-running the same command.

To reset download tracking remove the `downloaded.json` file from the show directory.
