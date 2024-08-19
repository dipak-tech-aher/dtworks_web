import { useNavigate } from "react-router-dom";

function useHistory() {
  const navigate = useNavigate();
  return navigate;
}

export { useHistory };
