import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiRequest, clearToken, getApiBase, getToken, setApiBase, setToken } from "./lib/apiClient";

const navItems = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Videos", path: "/videos" },
  { label: "Tweets", path: "/tweets" },
  { label: "Playlists", path: "/playlists" },
  { label: "Profile", path: "/profile" },
];

const toPrettyDate = (iso) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [baseUrl, setBaseUrlState] = useState(getApiBase());
  const [accessToken, setAccessToken] = useState(getToken());
  const [currentUser, setCurrentUser] = useState(null);
  const [banner, setBanner] = useState("");
  const [busy, setBusy] = useState(false);

  const [loginForm, setLoginForm] = useState({ username: "", email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
    avatar: null,
    coverImage: null,
  });

  const [dashboardData, setDashboardData] = useState(null);
  const [videoList, setVideoList] = useState([]);
  const [tweetList, setTweetList] = useState([]);
  const [playlistList, setPlaylistList] = useState([]);

  const [videoForm, setVideoForm] = useState({ title: "", description: "", videoFile: null, thumbnail: null });
  const [tweetForm, setTweetForm] = useState({ content: "" });
  const [playlistForm, setPlaylistForm] = useState({ name: "", description: "" });
  const [accountForm, setAccountForm] = useState({ fullName: "", email: "" });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "" });

  const currentView = useMemo(() => {
    const path = location.pathname.toLowerCase();
    if (path.startsWith("/videos")) return "Videos";
    if (path.startsWith("/tweets")) return "Tweets";
    if (path.startsWith("/playlists")) return "Playlists";
    if (path.startsWith("/profile")) return "Profile";
    return "Dashboard";
  }, [location.pathname]);

  const summaryItems = useMemo(() => {
    const summary = dashboardData?.summary;
    if (!summary) return [];
    return [
      ["Videos", summary.totalVideos],
      ["Views", summary.totalViews],
      ["Likes", summary.totalLikes],
      ["Subscribers", summary.subscriberCount],
      ["Subscriptions", summary.subscriptionCount],
      ["Playlists", summary.playlistCount],
      ["Comments", summary.commentCount],
      ["Tweets", summary.tweetCount],
    ];
  }, [dashboardData]);

  const runWithGuard = async (runner) => {
    setBusy(true);
    setBanner("");
    try {
      await runner();
    } catch (err) {
      setBanner(err.message || "Request failed");
    } finally {
      setBusy(false);
    }
  };

  const saveBaseUrl = () => {
    setApiBase(baseUrl.trim());
    setBanner("Base URL saved");
  };

  const loadCurrentUser = async (token) => {
    const response = await apiRequest({ baseUrl, path: "/user/current-user", method: "GET", token });
    const user = response?.data || null;
    setCurrentUser(user);
    setAccountForm({ fullName: user?.fullName || "", email: user?.email || "" });
    return user;
  };

  const loadDashboard = async (token) => {
    const response = await apiRequest({ baseUrl, path: "/dashboard", method: "GET", token });
    setDashboardData(response?.data || null);
  };

  const loadVideos = async (token) => {
    const response = await apiRequest({
      baseUrl,
      path: "/videos?includeUnpublished=true&limit=25",
      method: "GET",
      token,
    });
    const docs = response?.data?.docs || response?.data?.videos || [];
    setVideoList(Array.isArray(docs) ? docs : []);
  };

  const loadTweets = async (token, userId) => {
    if (!userId) return;
    const response = await apiRequest({ baseUrl, path: `/tweets/user/${userId}`, method: "GET", token });
    setTweetList(Array.isArray(response?.data) ? response.data : []);
  };

  const loadPlaylists = async (token, userId) => {
    if (!userId) return;
    const response = await apiRequest({ baseUrl, path: `/playlists/user/${userId}`, method: "GET", token });
    setPlaylistList(Array.isArray(response?.data) ? response.data : []);
  };

  const bootstrapData = async (token, providedUser = null) => {
    const user = providedUser || (await loadCurrentUser(token));
    await Promise.all([
      loadDashboard(token),
      loadVideos(token),
      loadTweets(token, user?._id),
      loadPlaylists(token, user?._id),
    ]);
  };

  useEffect(() => {
    if (location.pathname === "/") navigate("/dashboard", { replace: true });
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (!accessToken) return;
    runWithGuard(async () => {
      await bootstrapData(accessToken);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRegister = () =>
    runWithGuard(async () => {
      const formData = new FormData();
      formData.append("fullName", registerForm.fullName);
      formData.append("email", registerForm.email);
      formData.append("username", registerForm.username);
      formData.append("password", registerForm.password);
      if (registerForm.avatar) formData.append("avatar", registerForm.avatar);
      if (registerForm.coverImage) formData.append("coverImage", registerForm.coverImage);

      await apiRequest({
        baseUrl,
        path: "/user/register",
        method: "POST",
        bodyType: "multipart",
        body: formData,
      });

      setBanner("Registration successful. Login to continue.");
    });

  const onLogin = () =>
    runWithGuard(async () => {
      const response = await apiRequest({
        baseUrl,
        path: "/user/login",
        method: "POST",
        bodyType: "json",
        body: loginForm,
      });

      const token = response?.data?.accessToken;
      const user = response?.data?.user || null;
      if (!token) throw new Error("Access token not received");

      setAccessToken(token);
      setToken(token);
      setCurrentUser(user);
      await bootstrapData(token, user);
      navigate("/dashboard");
      setBanner("Login successful");
    });

  const onLogout = async () => {
    setBusy(true);
    setBanner("");
    let serverLogoutFailed = false;

    try {
      if (accessToken) {
        await apiRequest({ baseUrl, path: "/user/logout", method: "POST", token: accessToken });
      }
    } catch (_err) {
      serverLogoutFailed = true;
    } finally {
      clearToken();
      setAccessToken("");
      setCurrentUser(null);
      setDashboardData(null);
      setVideoList([]);
      setTweetList([]);
      setPlaylistList([]);
      navigate("/dashboard");
      setBanner(serverLogoutFailed ? "Logged out locally (server session may already be expired)." : "Logged out");
      setBusy(false);
    }
  };

  const onPublishVideo = () =>
    runWithGuard(async () => {
      const formData = new FormData();
      formData.append("title", videoForm.title);
      formData.append("description", videoForm.description);
      if (videoForm.videoFile) formData.append("videoFile", videoForm.videoFile);
      if (videoForm.thumbnail) formData.append("thumbnail", videoForm.thumbnail);

      await apiRequest({
        baseUrl,
        path: "/videos",
        method: "POST",
        token: accessToken,
        bodyType: "multipart",
        body: formData,
      });

      setVideoForm({ title: "", description: "", videoFile: null, thumbnail: null });
      await Promise.all([loadVideos(accessToken), loadDashboard(accessToken)]);
      setBanner("Video published");
    });

  const onTogglePublish = (videoId) =>
    runWithGuard(async () => {
      await apiRequest({ baseUrl, path: `/videos/${videoId}/toggle-publish`, method: "PATCH", token: accessToken });
      await loadVideos(accessToken);
    });

  const onDeleteVideo = (videoId) =>
    runWithGuard(async () => {
      await apiRequest({ baseUrl, path: `/videos/${videoId}`, method: "DELETE", token: accessToken });
      await Promise.all([loadVideos(accessToken), loadDashboard(accessToken)]);
    });

  const onCreateTweet = () =>
    runWithGuard(async () => {
      await apiRequest({
        baseUrl,
        path: "/tweets",
        method: "POST",
        token: accessToken,
        bodyType: "json",
        body: tweetForm,
      });
      setTweetForm({ content: "" });
      await Promise.all([loadTweets(accessToken, currentUser?._id), loadDashboard(accessToken)]);
    });

  const onDeleteTweet = (tweetId) =>
    runWithGuard(async () => {
      await apiRequest({ baseUrl, path: `/tweets/${tweetId}`, method: "DELETE", token: accessToken });
      await Promise.all([loadTweets(accessToken, currentUser?._id), loadDashboard(accessToken)]);
    });

  const onCreatePlaylist = () =>
    runWithGuard(async () => {
      await apiRequest({
        baseUrl,
        path: "/playlists",
        method: "POST",
        token: accessToken,
        bodyType: "json",
        body: playlistForm,
      });
      setPlaylistForm({ name: "", description: "" });
      await Promise.all([loadPlaylists(accessToken, currentUser?._id), loadDashboard(accessToken)]);
    });

  const onDeletePlaylist = (playlistId) =>
    runWithGuard(async () => {
      await apiRequest({ baseUrl, path: `/playlists/${playlistId}`, method: "DELETE", token: accessToken });
      await Promise.all([loadPlaylists(accessToken, currentUser?._id), loadDashboard(accessToken)]);
    });

  const onUpdateAccount = () =>
    runWithGuard(async () => {
      await apiRequest({
        baseUrl,
        path: "/user/update-account",
        method: "PATCH",
        token: accessToken,
        bodyType: "json",
        body: accountForm,
      });
      await loadCurrentUser(accessToken);
      setBanner("Account updated");
    });

  const onChangePassword = () =>
    runWithGuard(async () => {
      await apiRequest({
        baseUrl,
        path: "/user/change-password",
        method: "POST",
        token: accessToken,
        bodyType: "json",
        body: passwordForm,
      });
      setPasswordForm({ oldPassword: "", newPassword: "" });
      setBanner("Password changed");
    });

  return (
    <div className="app-shell">
      <aside className="side-nav">
        <h1>OmniSocial</h1>
        <p className="side-muted">Minimal Production UI</p>

        <nav>
          {navItems.map((item) => (
            <button
              key={item.path}
              className={item.label === currentView ? "active" : ""}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <section className="settings-box">
          <label>
            Base URL
            <input value={baseUrl} onChange={(event) => setBaseUrlState(event.target.value)} />
          </label>
          <button onClick={saveBaseUrl}>Save</button>
          <button onClick={onLogout} disabled={!accessToken || busy}>
            Logout
          </button>
        </section>
      </aside>

      <main className="main-area">
        <header className="main-top">
          <div>
            <h2>{currentView}</h2>
            <p>{currentUser ? `Signed in as @${currentUser.username}` : "Not logged in"}</p>
          </div>
          <span className={busy ? "status-badge busy" : "status-badge"}>{busy ? "Working" : "Ready"}</span>
        </header>

        {banner ? <p className="banner">{banner}</p> : null}

        {!accessToken ? (
          <section className="panel two-col">
            <article className="card">
              <h3>Login</h3>
              <label>Email</label>
              <input value={loginForm.email} onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))} />
              <label>Username</label>
              <input value={loginForm.username} onChange={(e) => setLoginForm((p) => ({ ...p, username: e.target.value }))} />
              <label>Password</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
              />
              <button onClick={onLogin} disabled={busy}>Login</button>
            </article>

            <article className="card">
              <h3>Register</h3>
              <label>Full name</label>
              <input value={registerForm.fullName} onChange={(e) => setRegisterForm((p) => ({ ...p, fullName: e.target.value }))} />
              <label>Email</label>
              <input value={registerForm.email} onChange={(e) => setRegisterForm((p) => ({ ...p, email: e.target.value }))} />
              <label>Username</label>
              <input value={registerForm.username} onChange={(e) => setRegisterForm((p) => ({ ...p, username: e.target.value }))} />
              <label>Password</label>
              <input
                type="password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm((p) => ({ ...p, password: e.target.value }))}
              />
              <label>Avatar</label>
              <input type="file" onChange={(e) => setRegisterForm((p) => ({ ...p, avatar: e.target.files?.[0] || null }))} />
              <label>Cover image</label>
              <input
                type="file"
                onChange={(e) => setRegisterForm((p) => ({ ...p, coverImage: e.target.files?.[0] || null }))}
              />
              <button onClick={onRegister} disabled={busy}>Register</button>
            </article>
          </section>
        ) : null}

        {accessToken && currentView === "Dashboard" ? (
          <section className="panel">
            <div className="stats-grid">
              {summaryItems.map(([label, value]) => (
                <article className="stat" key={label}>
                  <p>{label}</p>
                  <strong>{value ?? 0}</strong>
                </article>
              ))}
            </div>

            <div className="three-col">
              <article className="card">
                <h3>Recent Videos</h3>
                {(dashboardData?.recent?.videos || []).map((item) => (
                  <div className="list-item" key={item._id}>
                    <p>{item.title}</p>
                    <span>{toPrettyDate(item.createdAt)}</span>
                  </div>
                ))}
              </article>

              <article className="card">
                <h3>Recent Tweets</h3>
                {(dashboardData?.recent?.tweets || []).map((item) => (
                  <div className="list-item" key={item._id}>
                    <p>{item.content}</p>
                    <span>{toPrettyDate(item.createdAt)}</span>
                  </div>
                ))}
              </article>

              <article className="card">
                <h3>Recent Playlists</h3>
                {(dashboardData?.recent?.playlists || []).map((item) => (
                  <div className="list-item" key={item._id}>
                    <p>{item.name}</p>
                    <span>{toPrettyDate(item.createdAt)}</span>
                  </div>
                ))}
              </article>
            </div>
          </section>
        ) : null}

        {accessToken && currentView === "Videos" ? (
          <section className="panel two-col">
            <article className="card">
              <h3>Publish Video</h3>
              <label>Title</label>
              <input value={videoForm.title} onChange={(e) => setVideoForm((p) => ({ ...p, title: e.target.value }))} />
              <label>Description</label>
              <textarea
                rows={4}
                value={videoForm.description}
                onChange={(e) => setVideoForm((p) => ({ ...p, description: e.target.value }))}
              />
              <label>Video file</label>
              <input type="file" onChange={(e) => setVideoForm((p) => ({ ...p, videoFile: e.target.files?.[0] || null }))} />
              <label>Thumbnail</label>
              <input type="file" onChange={(e) => setVideoForm((p) => ({ ...p, thumbnail: e.target.files?.[0] || null }))} />
              <button onClick={onPublishVideo} disabled={busy}>Publish</button>
            </article>

            <article className="card">
              <h3>Your Videos</h3>
              {videoList.map((video) => (
                <div key={video._id} className="list-item wide">
                  <div>
                    <p>{video.title}</p>
                    <span>{video.isPublished ? "Published" : "Draft"}</span>
                  </div>
                  <div className="row-actions">
                    <button onClick={() => onTogglePublish(video._id)} disabled={busy}>Toggle</button>
                    <button onClick={() => onDeleteVideo(video._id)} disabled={busy}>Delete</button>
                  </div>
                </div>
              ))}
            </article>
          </section>
        ) : null}

        {accessToken && currentView === "Tweets" ? (
          <section className="panel two-col">
            <article className="card">
              <h3>Create Tweet</h3>
              <textarea rows={4} value={tweetForm.content} onChange={(e) => setTweetForm({ content: e.target.value })} />
              <button onClick={onCreateTweet} disabled={busy}>Post</button>
            </article>

            <article className="card">
              <h3>Your Tweets</h3>
              {tweetList.map((tweet) => (
                <div key={tweet._id} className="list-item wide">
                  <div>
                    <p>{tweet.content}</p>
                    <span>{toPrettyDate(tweet.createdAt)}</span>
                  </div>
                  <button onClick={() => onDeleteTweet(tweet._id)} disabled={busy}>Delete</button>
                </div>
              ))}
            </article>
          </section>
        ) : null}

        {accessToken && currentView === "Playlists" ? (
          <section className="panel two-col">
            <article className="card">
              <h3>Create Playlist</h3>
              <label>Name</label>
              <input value={playlistForm.name} onChange={(e) => setPlaylistForm((p) => ({ ...p, name: e.target.value }))} />
              <label>Description</label>
              <textarea
                rows={3}
                value={playlistForm.description}
                onChange={(e) => setPlaylistForm((p) => ({ ...p, description: e.target.value }))}
              />
              <button onClick={onCreatePlaylist} disabled={busy}>Create</button>
            </article>

            <article className="card">
              <h3>Your Playlists</h3>
              {playlistList.map((playlist) => (
                <div key={playlist._id} className="list-item wide">
                  <div>
                    <p>{playlist.name}</p>
                    <span>{playlist.description || "No description"}</span>
                  </div>
                  <button onClick={() => onDeletePlaylist(playlist._id)} disabled={busy}>Delete</button>
                </div>
              ))}
            </article>
          </section>
        ) : null}

        {accessToken && currentView === "Profile" ? (
          <section className="panel two-col">
            <article className="card">
              <h3>Account Details</h3>
              <label>Full name</label>
              <input value={accountForm.fullName} onChange={(e) => setAccountForm((p) => ({ ...p, fullName: e.target.value }))} />
              <label>Email</label>
              <input value={accountForm.email} onChange={(e) => setAccountForm((p) => ({ ...p, email: e.target.value }))} />
              <button onClick={onUpdateAccount} disabled={busy}>Update</button>
            </article>

            <article className="card">
              <h3>Change Password</h3>
              <label>Old password</label>
              <input
                type="password"
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, oldPassword: e.target.value }))}
              />
              <label>New password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
              />
              <button onClick={onChangePassword} disabled={busy}>Change</button>
            </article>
          </section>
        ) : null}
      </main>
    </div>
  );
}

export default App;
