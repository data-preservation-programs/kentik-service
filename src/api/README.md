## Example API calls
### Get all providers
```shell
curl "https://kentik.reputationdao.services/api?method=listProviders"
```

### Get general stats and last result
```shell
curl "https://kentik.reputationdao.services/api?method=getLocalStats&provider=f0xxxx
```

### Get local ping history
```shell
curl "https://kentik.reputationdao.services/api?method=getHistory&provider=f0xxxx&from=1680148976&to=2030-01-01"
```

### Get global ping result
```shell
curl "https://kentik.reputationdao.services/api?method=getGlobalResult&provider=f0xxxx
```
