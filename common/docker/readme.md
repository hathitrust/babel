This dicrectory is used to hold the dockerfile fragments for each service.
The purpose is to help reduce complexties in the top level `docker-compose.yml` file and to organize individual services for re-use.

`exteds`
- Inherits and overrides configurations from another Compose file.
- Allows you to define a base service configuration and then extend it in other files, overriding specific attributes as needed.
- Relative paths in the extended file are resolved relative to the main Compose file.

`include`
- Incorporates another Compose file directly into the current one.
- Merges the included Compose files into the main one, treating them as if they were defined within the same file.
- Service names cannot be adjusted, making it difficult to introduce a second instance of the same service.