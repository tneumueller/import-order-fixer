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

- `include`: Array of regex strings the filenames are tested against. Files are excluded unless specified.
- `exclude`: Array of regex strings the filenames are tested against. Directories are included unless specified.
- `order`: Array of strings containing the names of types. The import groups will be sorted in this manner
- `space`: Object
  - `afterImports`: Number of empty lines to insert after imports and before the rest of the code
  - `afterGroup`: Number of empty lines to insert after each import group
- `types`: Array of objects with the following properties
  - `matches`: Array of regex strings the import paths will be tested against
  - `comment`: Comment, which will be added in the line before the import group
  - `space`: Number or Object. If number, specifies the number of empty lines to insert after this group. Overrides global space settings
    - `before`: Number or Object. If number, specifies the number of empty lines before the group
        - `size`: Number of empty lines
        - `if`: Expression, which must evaluate to true. See **Expressions**
    - `after`: Number or Object. If number, specifies the number of empty lines after the group
        - `size`: Number of empty lines
        - `if`: Expression, which must evaluate to true. See **Expressions**

### Example config
The following JSON object is an example for how the config file could look like. This one applies to Angular2 and Typescript.  Safe it inside the project folder and with the name `imports.json`

```json
{
  "include": [
    "\\.ts$"
  ],
  "exclude": [
    "node_modules"
  ],
  "space": {
    "afterGroup": 0,
    "afterImports": 1
  },
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
      ],
      "space": {
        "after": {
          "size": 1,
          "if": "$size >= 3"
        }
      },
      "comment": "angular"
    },
    "app": {
      "matches": [
        "^app\\/.*"
      ],
      "comment": "app"
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


## Expressions

Expressions can be used for the `if` property of the spacing/before/after properties. They can be of the following form:
- Boolean expression: One single value, may be negotiated with a `!`. Example: `!$first`
- Comparison: Comparison between two values, on the left a variable, on the right a number. Example: `$count > 4`

Available variables are:
- `$first` - boolean: `true`, if this import group is the first one
- `$last` - boolean: `true`, if this import group is the last one
- `$size` - number: The number of import statements in the current group
- `$count` - number: The number of import groups