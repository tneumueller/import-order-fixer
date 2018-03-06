# sort-imports
A configurable NodeJs script that reorders import statements

## Install
`npm i -g tneumueller/sort-imports`

## Run
Run `sort-imports` with the following parameters:
- `-r`: Recursive
- `-s --save`: Save-Mode, no files will be overwritten but instead receive the postfix '.cleaned'
- `<directory>`: One or more directories, for which the reordering should be performed

## Config

- `files`: Array of regex strings the filenames are tested against
- `order`: Array of strings containing the names of types. The import groups will be sorted in this manner
- `types`: Array of objects with the following properties
  - `matches`: Array of regex strings the import paths will be tested against
  - `comment`: Comment, which will be added in the line before the import group (optional)

### Example config
The following JSON object is an example for how the config file could look like. This one applies to Angular2 and Typescript.  Safe it inside the project folder and with the name `imports.json`

```json
{
    "files": [
        ".*\\.ts"
    ],
    "order": [
        "angular",
        "vendor",
        "modules",
        "components",
        "app",
        "any"
    ],
    "types": {
        "angular": {
            "matches": [
                "@angular",
                "@ngrx",
                "rxjs"
            ]
        },
        "app": {
            "matches": [
                "^app\\/.*"
            ]
        },
        "vendor": {
            "matches": [
                "^[^.]"
            ]
        },
        "modules": {
            "matches": [
                "..?\\/.*\\.module(.(ts|js))?"
            ]
        },
        "components": {
            "matches": [
                "..?\\/.*\\.component(.(ts|js))?"
            ]
        },
        "any": {
            "matches": [
                ".*"
            ]
        }
    }
}

```
