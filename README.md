# giantbomb-show-dl

Command line tool to download full Giant Bomb shows with a single command.

## Requirements

- [Node.js](https://nodejs.org/) (version 15 or later)

## How to

The easiest way to run this tool is to use `npx`.

```shell
npx giantbomb-show-dl --api_key <YOUR_API_KEY> --show "Unprofessional Fridays" --dir "~/Downloads/GiantBomb"
```

It's also possible to install the tool globally using `npm`, after which the binary can be used in your shell. If you use this method make sure to regularly check for updates.

```shell
npm install -g giantbomb-show-dl

giantbomb-show-dl --api_key <YOUR_API_KEY> --show "Unprofessional Fridays" --dir "~/Downloads/GiantBomb"
```

## Options

| Option        | Required | Description                                                                                                                                                        |
| ------------- | :------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--api_key`   |    ✅    | Your Giant Bomb API key, can be found at https://www.giantbomb.com/api/.                                                                                           |
| `--show`      |    ✅    | Name of the Giant Bomb show to download, must be an exact match.                                                                                                   |
| `--dir`       |    ✅    | Directory the show should be downloaded to, a subdirectory will be created for each show.                                                                          |
| `--quality`   |    ❌    | Quality to download videos in, will fall back to lower quality if selected is not available. Defaults to `highest`. Options are `low`, `high`, `hd` and `highest`. |
| `--from_date` |    ❌    | Videos published before this date will not be downloaded. Formatted as `YYYY-MM-DD`.                                                                               |
| `--to_date`   |    ❌    | Videos published after this date will not be downloaded. Formatted as `YYYY-MM-DD`.                                                                                |

## Features

### Highest quality

Will always download the highest quality available for each video. Normally the API does not return 8k versions of videos. but this tool checks if they are available and downloads them when the quality `highest` is used.

### Show poster download

Automatically download the poster image for the selected show. This can be used in libraries like Plex.

### Rate limiting

This tool will autmatically rate limit API requests to not exceed Giant Bomb API usage guidelines.

### Download tracking

Will keep track of which files are downloaded successfully. These files will not be downloaded again on the next run, this provides an easy way to retry failed downloads by re-running the same command.

To reset download tracking remove the `downloaded.json` file from the show directory.
