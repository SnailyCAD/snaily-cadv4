import { useAuth } from "context/AuthContext";
import { useImageUrl } from "hooks/useImageUrl";

export function AuthScreenImages() {
  const { cad } = useAuth();
  const { authScreenBgImageId, authScreenHeaderImageId } = cad?.miscCadSettings ?? {};
  const { makeImageUrl } = useImageUrl();

  return (
    <>
      {authScreenBgImageId ? (
        <img
          draggable={false}
          className="fixed inset-0 z-0 h-screen w-screen object-cover"
          src={makeImageUrl("cad", authScreenBgImageId)}
          alt="Authentication view background"
        />
      ) : null}

      {authScreenHeaderImageId ? (
        <img
          className="z-10 mb-10 mt-10 rounded-md drop-shadow-lg object-cover"
          style={{ minWidth: 20, maxWidth: 400, maxHeight: 200, zIndex: 999 }}
          src={makeImageUrl("cad", authScreenHeaderImageId)}
          alt={cad?.name || "Authentication view header"}
        />
      ) : null}
    </>
  );
}
