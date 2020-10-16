pragma solidity ^0.5.11;

contract SimpleERC20Token {
    string public constant name = "SERToken";
    string public constant symbol = "SER";
    uint8 public constant decimals = 18;

    using SafeMath for uint256;

    event Approval(address indexed tokenOwner, address indexed spender, uint tokens);
    event Transfer(address indexed from, address indexed to, uint tokens);

    mapping (address => uint256) private _balances;
    mapping (address => mapping (address => uint256)) private _allowed;
    uint256 private _totalSupply;

    address private _owner;

    constructor(uint256 initialSupply) public {
        _totalSupply = initialSupply;
        _owner = msg.sender;
        _balances[_owner] = _totalSupply;
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address owner) public view returns (uint256) {
        return _balances[owner];
    }

    function allowance(address owner, address spender) public view returns (uint256) {
        return _allowed[owner][spender];
    }

    function transfer(address to, uint256 value) public returns (bool) {
        require(value <= _balances[msg.sender], "Insufficient balance");
        require(to != address(0), "Invalid receipient address");

        _balances[msg.sender] = _balances[msg.sender].sub(value);
        _balances[to] = _balances[to].add(value);
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) public returns (bool) {
        require(spender != address(0), "Spender address is invalid");

        _allowed[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) public returns (bool) {
        require(value <= _balances[from], "Owner has insufficient balance");
        require(value <= _allowed[from][msg.sender], "Transfer amount exceeds allowed value");
        require(to != address(0), "Receipient address is invalid");

        _balances[from] = _balances[from].sub(value);
        _balances[to] = _balances[to].add(value);
        _allowed[from][msg.sender] = _allowed[from][msg.sender].sub(value);
        emit Transfer(from, to, value);
        return true;
    }
    
    function recoverSigner(bytes32 message, bytes memory sig)
       public
       pure
       returns (address)
    {
       uint8 v;
       bytes32 r;
       bytes32 s;

       (v, r, s) = splitSignature(sig);
       return ecrecover(message, v, r, s);
  }

  function splitSignature(bytes memory sig)
       public
       pure
       returns (uint8, bytes32, bytes32)
   {
       require(sig.length == 65);
       
       bytes32 r;
       bytes32 s;
       uint8 v;

       assembly {
           r := mload(add(sig, 32))
           s := mload(add(sig, 64))
           v := byte(0, mload(add(sig, 96)))
       }

       return (v, r, s);
   }
    
    function persistState (
        address participant1,
        address participant2,
        uint participant1Bal,
        uint participant2Bal,
        bytes32 participant1Message,
        bytes32 participant2Message,
        bytes memory participant1Signature,
        bytes memory participant2Signature
    ) public {
        uint sumCurrentBal = balanceOf(participant1) + balanceOf(participant2);

        require(msg.sender == participant1 || msg.sender == participant2, "Transaction allowed for only participants");
        
        // validate signatures of both participants
        address recoveredAddress1 = recoverSigner(participant1Message, participant1Signature);
        
        require(recoveredAddress1 == participant1, "participant1 does not match recovered signature");
        address recoveredAddress2 = recoverSigner(participant2Message, participant2Signature);
        
        require(recoveredAddress2 == participant2, "participant2 does not match recovered signature");
        
        require(sumCurrentBal == participant1Bal + participant2Bal, "Sum of current balances must equal sum of new balances");
        
        
        _balances[participant1] = participant1Bal;
        _balances[participant2] = participant2Bal;
        
    }
}

library SafeMath {
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        assert(b <= a);
        return a - b;
    }

    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        assert(c >= a);
        return c;
    }
}