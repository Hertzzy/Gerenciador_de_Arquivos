import React from "react";
// Importa a modal do react-modal
import Modal from "react-modal";
import { AiOutlineClose } from "react-icons/ai";
import NewProcess from "../Forms/NewProcess";

// Código necessário para os recursos de acessibilidade
Modal.setAppElement("#root");

function ModalNewDocumentA() {
  const [modalIsOpen, setIsOpen] = React.useState(false);

  // Função que abre a modal
  function abrirModal() {
    setIsOpen(true);
  }

  // Função que fecha a modal
  function fecharModal() {
    setIsOpen(false);
  }

  // Código JSX necessário para criar uma modal simples que abre e fecha
  return (
    <div>
      <button onClick={abrirModal} className="btnOpen">
        Adicionar Processo
      </button>
      <Modal
        className="modalStyle"
        overlayClassName="modal-overlay"
        isOpen={modalIsOpen}
        onRequestClose={fecharModal}
        contentLabel="Modal de exemplo"
      >
        <div className="topModal">
          <div></div>
          <button onClick={fecharModal}>
            <AiOutlineClose />
          </button>
        </div>
        <NewProcess />
      </Modal>
    </div>
  );
}

export default ModalNewDocumentA;
