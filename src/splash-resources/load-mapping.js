function buildShareResource(configs) {
    const path = getClientPath(configs, "shared-resources");
    return buildUrl("http", path, configs);
}

function buildUrl(protocol, path, configs) {
    protocol = protocol || "http";
    path = path || "/";
    const ssl = configs.ssl;
    const domain = getRootDomain(configs);
    const subDomain = configs.clientSubDomain ?? configs.subDomain;
    const subDomainText = `${subDomain}.`;

    return `${protocol}${ssl ? "s" : ""}://${subDomain === "" ? "" : subDomainText}${domain}${path}`;
}

function getRootDomain(configs) {
    const hostName = window.location.hostname;
    return (!!configs.serverDomainMapper && configs.serverDomainMapper[hostName]) || extractDomainFromHostName(hostName);
}

function extractDomainFromHostName(hostName) {
    const domainParts = hostName.split(".").reverse();
    return `${domainParts[1]}.${domainParts[0]}`;
}

function getClientPath(configs, name) {
    const subDirectory = configs?.subDirectory ? `/${configs?.subDirectory}` : "";
    return `${subDirectory}/${name}`;
}

async function getMapping(configPath) {
    try {
        const shareResourceUrl = buildShareResource(globalThis.envConfig);
        const localeMappingUrl = `${shareResourceUrl}/${configPath}`;
        const response = await fetch(localeMappingUrl);
        return await response.json();
    } catch (error) {
        return {};
    }
}

(async function () {
    const remoteInfo = await getMapping(`localization/info.json?v=${Date.now().toString()}`);
    globalThis.localeMapping = {
        "es-ES": "es",
        "tr-TR": "tr",
        "fil-PH": "fil_ph",
        "ko-KR": "ko",
        "hi-IN": "hi_in",
        "bn-BD": "bn_bd",
        "ms-MY": "ms_my",
        "pt-BR": "pt_br",
    };
    globalThis.fontMapping = await getMapping(
        `localization/configs/font-mapping.json?v=${remoteInfo?.versionFontMapping ?? Date.now().toString()}`
    );

    globalThis.dispatchEvent(new Event("localeMappingLoaded"));
})();
