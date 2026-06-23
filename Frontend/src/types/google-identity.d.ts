interface GoogleTokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
}

interface GoogleOAuth2 {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (response: {
      access_token?: string;
      error?: string;
      error_description?: string;
    }) => void;
  }) => GoogleTokenClient;
}

interface GoogleAccounts {
  oauth2: GoogleOAuth2;
}

interface GoogleIdentity {
  accounts: GoogleAccounts;
}

interface Window {
  google?: GoogleIdentity;
}
