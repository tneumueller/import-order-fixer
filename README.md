# import-order-fixer
A configurable NodeJs script that reorders import statements

## Example config
safe in `config.json`

```json
{
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
