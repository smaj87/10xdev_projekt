# Zasady routingu backendu

- Routing Fastify dla każdego endpointu umieszczamy w osobnym pliku w katalogu `server/routes/`.
- Nazwa pliku powinna odpowiadać nazwie endpointu, z rozszerzeniem `.routes.mjs`, np.:
  - `/list` → `list.routes.mjs`
  - `/task` → `task.routes.mjs`
- W pliku `[nazwa].routes.mjs` możemy rejestrować wszystkie metody HTTP (GET, POST, PUT, DELETE itd.) dla danego endpointu.
- Gdy, nie ma zaimplementowanej ktorejs metody api powinno zwracac 405 Method Not Allowed
- Każdy endpoint, który przyjmuje dane (np. body, query, params), musi mieć dodaną walidację schematu Fastify (`schema`).
  - Przykład:
    ```js
    fastify.post('/task', {
      schema: {
        body: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string' },
            completed: { type: 'boolean' }
          }
        }
      }
    }, async (request, reply) => { /* ... */ });
    ```
- Każdy plik eksportuje funkcję, która przyjmuje instancję Fastify i rejestruje odpowiednie trasy, np.:
  ```js
  // server/routes/list.routes.mjs
  export default async function (fastify) {
    fastify.get('/list', async (request, reply) => { /* ... */ });
    fastify.post('/list', async (request, reply) => { /* ... */ });
    // ...inne metody...
  }
  ```
- Wszystkie pliki z katalogu `server/routes/` są automatycznie ładowane przez middleware `server/middlewares/apiMiddlavare.mjs` za pomocą narzędzia `server/utils/routeLoader.mjs`.
- Nie trzeba ręcznie importować plików routingu w głównym pliku serwera – ładowanie odbywa się automatycznie.
- Każdy endpoint powinien mieć własny plik routingu. Jeśli endpoint ma podścieżki (np. `/task/:id`), obsługujemy je w tym samym pliku.
- Nowe endpointy dodajemy przez utworzenie nowego pliku `[nazwa].routes.mjs` w katalogu `server/routes/` i zarejestrowanie tras zgodnie z powyższym wzorcem.

## Przykład struktury katalogu routes

```
server/
  routes/
    list.routes.mjs
    task.routes.mjs
    user.routes.mjs
```

## Przykład pliku routes

```js
// server/routes/task.routes.mjs
export default async function (fastify) {
  fastify.get('/task', async (request, reply) => { /* ... */ });
  fastify.post('/task', {
    schema: {
      body: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string' },
          completed: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => { /* ... */ });
  fastify.put('/task/:id', async (request, reply) => { /* ... */ });
  fastify.delete('/task/:id', async (request, reply) => { /* ... */ });
}
```

## Automatyczne ładowanie

- Nie modyfikuj ręcznie `apiMiddlavare.mjs` ani `routeLoader.mjs` przy dodawaniu nowych endpointów.
- Każdy plik `[nazwa].routes.mjs` zostanie automatycznie wykryty i zarejestrowany.
