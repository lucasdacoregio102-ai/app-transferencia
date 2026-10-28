// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract PixEscrow is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    enum EscrowStatus { Created, Released, Refunded, Disputed }

    struct Escrow {
        address buyer;
        address seller;
        uint256 amount;
        uint256 createdAt;
        uint256 expirationTime;
        EscrowStatus status;
    }

    IERC20 public immutable usdcToken;
    address public feeRecipient;
    uint256 public feeBps;
    uint256 public constant MAX_FEE_BPS = 500;

    mapping(uint256 => Escrow) public escrows;
    uint256 public escrowCounter;

    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        uint256 expirationTime
    );
    event EscrowReleased(uint256 indexed escrowId, uint256 netAmount, uint256 feeAmount);
    event EscrowRefunded(uint256 indexed escrowId, uint256 amount);
    event EscrowDisputed(uint256 indexed escrowId, address indexed raisedBy);
    event DisputeResolved(uint256 indexed escrowId, uint256 buyerAmount, uint256 sellerAmount);
    event FeeUpdated(uint256 newFeeBps, address newFeeRecipient);

    constructor(
        address _usdcAddress,
        address _feeRecipient,
        uint256 _feeBps
    ) Ownable(msg.sender) {
        require(_usdcAddress != address(0), "USDC invalido");
        require(_feeRecipient != address(0), "Fee recipient invalido");
        require(_feeBps <= MAX_FEE_BPS, "Taxa excede o maximo");

        usdcToken = IERC20(_usdcAddress);
        feeRecipient = _feeRecipient;
        feeBps = _feeBps;
    }

    function createEscrow(
        address _seller,
        uint256 _amount,
        uint256 _durationSeconds
    ) external whenNotPaused nonReentrant returns (uint256 escrowId) {
        require(_seller != address(0), "Vendedor invalido");
        require(_seller != msg.sender, "Comprador e vendedor sao iguais");
        require(_amount > 0, "Valor deve ser maior que zero");
        require(_durationSeconds >= 1 hours, "Duracao minima de 1 hora");

        escrowId = escrowCounter++;
        uint256 expTime = block.timestamp + _durationSeconds;

        escrows[escrowId] = Escrow({
            buyer: msg.sender,
            seller: _seller,
            amount: _amount,
            createdAt: block.timestamp,
            expirationTime: expTime,
            status: EscrowStatus.Created
        });

        usdcToken.safeTransferFrom(msg.sender, address(this), _amount);

        emit EscrowCreated(escrowId, msg.sender, _seller, _amount, expTime);
    }

    function releaseFunds(uint256 _escrowId) external whenNotPaused nonReentrant {
        Escrow storage item = escrows[_escrowId];

        require(item.status == EscrowStatus.Created, "Escrow nao esta ativo");
        require(msg.sender == item.buyer || msg.sender == owner(), "Nao autorizado");

        item.status = EscrowStatus.Released;

        uint256 feeAmount = (item.amount * feeBps) / 10000;
        uint256 netAmount = item.amount - feeAmount;

        if (feeAmount > 0) {
            usdcToken.safeTransfer(feeRecipient, feeAmount);
        }
        usdcToken.safeTransfer(item.seller, netAmount);

        emit EscrowReleased(_escrowId, netAmount, feeAmount);
    }

    function refundBuyer(uint256 _escrowId) external whenNotPaused nonReentrant {
        Escrow storage item = escrows[_escrowId];

        require(item.status == EscrowStatus.Created, "Escrow nao esta ativo");

        bool isSeller = (msg.sender == item.seller);
        bool isExpiredBuyer = (msg.sender == item.buyer && block.timestamp >= item.expirationTime);
        bool isAdmin = (msg.sender == owner());

        require(isSeller || isExpiredBuyer || isAdmin, "Nao autorizado para reembolsar");

        item.status = EscrowStatus.Refunded;

        usdcToken.safeTransfer(item.buyer, item.amount);

        emit EscrowRefunded(_escrowId, item.amount);
    }

    function raiseDispute(uint256 _escrowId) external whenNotPaused {
        Escrow storage item = escrows[_escrowId];

        require(item.status == EscrowStatus.Created, "Escrow nao esta ativo");
        require(msg.sender == item.buyer || msg.sender == item.seller, "Apenas partes envolvidas");

        item.status = EscrowStatus.Disputed;

        emit EscrowDisputed(_escrowId, msg.sender);
    }

    function resolveDispute(
        uint256 _escrowId,
        uint256 _buyerShareBps
    ) external onlyOwner nonReentrant {
        Escrow storage item = escrows[_escrowId];

        require(item.status == EscrowStatus.Disputed, "Escrow nao esta em disputa");
        require(_buyerShareBps <= 10000, "Proporcao invalida");

        item.status = EscrowStatus.Released;

        uint256 buyerAmount = (item.amount * _buyerShareBps) / 10000;
        uint256 sellerAmount = item.amount - buyerAmount;

        if (buyerAmount > 0) {
            usdcToken.safeTransfer(item.buyer, buyerAmount);
        }
        if (sellerAmount > 0) {
            usdcToken.safeTransfer(item.seller, sellerAmount);
        }

        emit DisputeResolved(_escrowId, buyerAmount, sellerAmount);
    }

    function setFeeConfig(uint256 _newFeeBps, address _newRecipient) external onlyOwner {
        require(_newFeeBps <= MAX_FEE_BPS, "Taxa excede o maximo");
        require(_newRecipient != address(0), "Recipient invalido");
        feeBps = _newFeeBps;
        feeRecipient = _newRecipient;
        emit FeeUpdated(_newFeeBps, _newRecipient);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}