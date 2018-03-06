# import-order-fixer
A configurable NodeJs script that reorders import statements

## Example config
The following JSON object is an example for how the config file could look like. This one applies to Angular2 and Typescript.  Safe it inside the project folder and with the name `imports.json`

```json
{
    "files": [
        ".*\\.ts"
    ],
    "sort-order": [
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
