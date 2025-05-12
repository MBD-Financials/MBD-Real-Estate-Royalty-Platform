// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title RealEstateDApp
 * @dev A smart contract for a real estate decentralized application
 * Features:
 * - Property listing with royalty system (up to 3 royalty holders)
 * - Multi-buyer support (up to 3 buyers)
 * - Commission fees for the platform
 * - Admin controls and reporting
 */
contract RealEstateDApp is Ownable, ReentrancyGuard {
    // State variables
    uint256 public listingFee; // Fee for listing a property
    uint256 public purchaseFee; // Fee percentage on property purchases (in basis points, 100 = 1%)
    uint256 public propertyCount;
    
    // Struct to store royalty holder information
    struct RoyaltyHolder {
        address payable holderAddress;
        uint256 percentage; // in basis points (100 = 1%)
        bool hasApproved;
    }
    
    // Struct to store buyer information
    struct Buyer {
        address payable buyerAddress;
        uint256 sharePercentage; // in basis points (100 = 1%)
        uint256 amountPaid;
        bool hasPaid;
    }
    
    // Property status enum
    enum PropertyStatus {
        Listed,
        UnderContract,
        Sold,
        Cancelled
    }
    
    // Property struct to store property details
    struct Property {
        uint256 propertyId;
        string propertyUri; // IPFS URI containing property metadata (images, description, etc.)
        address payable owner;
        uint256 price;
        PropertyStatus status;
        uint256 royaltyHolderCount;
        mapping(uint256 => RoyaltyHolder) royaltyHolders;
        uint256 buyerCount;
        mapping(uint256 => Buyer) buyers;
        uint256 createdAt;
        uint256 updatedAt;
    }
    
    // Mapping from property ID to Property
    mapping(uint256 => Property) public properties;
    
    // Transactions mapping for reporting
    struct Transaction {
        uint256 transactionId;
        uint256 propertyId;
        address from;
        address to;
        uint256 amount;
        uint256 timestamp;
        string transactionType; // "Listing", "Purchase", "RoyaltyPayment", etc.
    }
    
    mapping(uint256 => Transaction) public transactions;
    uint256 public transactionCount;
    
    // Events
    event PropertyListed(uint256 indexed propertyId, address indexed owner, uint256 price);
    event PropertyUpdated(uint256 indexed propertyId, uint256 price, PropertyStatus status);
    event PropertyPurchased(uint256 indexed propertyId, address indexed buyer, uint256 amount);
    event RoyaltyApproved(uint256 indexed propertyId, address indexed holder, uint256 percentage);
    event RoyaltyPaid(uint256 indexed propertyId, address indexed holder, uint256 amount);
    event BuyerAdded(uint256 indexed propertyId, address indexed buyer, uint256 sharePercentage);
    event BuyerPaid(uint256 indexed propertyId, address indexed buyer, uint256 amount);
    event TransactionRecorded(uint256 indexed transactionId, string transactionType);
    event ListingFeeUpdated(uint256 newFee);
    event PurchaseFeeUpdated(uint256 newFee);
    
    /**
     * @dev Constructor to initialize the contract
     * @param _listingFee Initial listing fee in wei
     * @param _purchaseFee Initial purchase fee in basis points (100 = 1%)
     */
    constructor(uint256 _listingFee, uint256 _purchaseFee) Ownable(msg.sender) {
        listingFee = _listingFee;
        purchaseFee = _purchaseFee;
        propertyCount = 0;
        transactionCount = 0;
    }
    
    /**
     * @dev Function to list a property with royalty holders
     * @param _propertyUri IPFS URI containing property metadata
     * @param _price Price of the property in wei
     * @param _royaltyHolders Array of royalty holders' addresses
     * @param _royaltyPercentages Array of royalty percentages in basis points
     * @return Property ID of the newly listed property
     */
    function listProperty(
        string memory _propertyUri,
        uint256 _price,
        address payable[] memory _royaltyHolders,
        uint256[] memory _royaltyPercentages
    ) public payable nonReentrant returns (uint256) {
        require(msg.value >= listingFee, "Listing fee not provided");
        require(_royaltyHolders.length <= 3, "Maximum 3 royalty holders allowed");
        require(_royaltyHolders.length == _royaltyPercentages.length, "Array length mismatch");
        
        // Calculate total royalty percentage
        uint256 totalRoyaltyPercentage = 0;
        for (uint256 i = 0; i < _royaltyPercentages.length; i++) {
            totalRoyaltyPercentage += _royaltyPercentages[i];
        }
        require(totalRoyaltyPercentage <= 5000, "Total royalty cannot exceed 50%");
        
        // Transfer listing fee to contract owner
        payable(owner()).transfer(msg.value);
        
        // Create new property
        uint256 newPropertyId = ++propertyCount;
        Property storage newProperty = properties[newPropertyId];
        newProperty.propertyId = newPropertyId;
        newProperty.propertyUri = _propertyUri;
        newProperty.owner = payable(msg.sender);
        newProperty.price = _price;
        newProperty.status = PropertyStatus.Listed;
        newProperty.royaltyHolderCount = _royaltyHolders.length;
        newProperty.createdAt = block.timestamp;
        newProperty.updatedAt = block.timestamp;
        
        // Add royalty holders
        for (uint256 i = 0; i < _royaltyHolders.length; i++) {
            newProperty.royaltyHolders[i] = RoyaltyHolder({
                holderAddress: _royaltyHolders[i],
                percentage: _royaltyPercentages[i],
                hasApproved: false
            });
        }
        
        // Record transaction
        _recordTransaction(
            newPropertyId,
            msg.sender,
            address(this),
            msg.value,
            "Listing"
        );
        
        emit PropertyListed(newPropertyId, msg.sender, _price);
        
        return newPropertyId;
    }
    
    /**
     * @dev Function to update property details
     * @param _propertyId ID of the property to update
     * @param _price New price of the property
     * @param _propertyUri New IPFS URI containing property metadata
     */
    function updateProperty(
        uint256 _propertyId,
        uint256 _price,
        string memory _propertyUri
    ) public {
        Property storage property = properties[_propertyId];
        require(msg.sender == property.owner, "Only owner can update property");
        require(property.status == PropertyStatus.Listed, "Property not listed");
        
        property.price = _price;
        property.propertyUri = _propertyUri;
        property.updatedAt = block.timestamp;
        
        emit PropertyUpdated(_propertyId, _price, property.status);
    }
    
    /**
     * @dev Function to approve a property sale by a royalty holder
     * @param _propertyId ID of the property to approve
     */
    function approvePropertySale(uint256 _propertyId) public {
        Property storage property = properties[_propertyId];
        require(property.status == PropertyStatus.Listed, "Property not listed");
        
        bool isRoyaltyHolder = false;
        uint256 holderIndex;
        
        for (uint256 i = 0; i < property.royaltyHolderCount; i++) {
            if (property.royaltyHolders[i].holderAddress == msg.sender) {
                isRoyaltyHolder = true;
                holderIndex = i;
                break;
            }
        }
        
        require(isRoyaltyHolder, "Not a royalty holder for this property");
        require(!property.royaltyHolders[holderIndex].hasApproved, "Already approved");
        
        property.royaltyHolders[holderIndex].hasApproved = true;
        property.updatedAt = block.timestamp;
        
        emit RoyaltyApproved(_propertyId, msg.sender, property.royaltyHolders[holderIndex].percentage);
    }
    
    /**
     * @dev Function to add a buyer for a property
     * @param _propertyId ID of the property to buy
     * @param _buyer Address of the buyer
     * @param _sharePercentage Percentage of ownership in basis points (100 = 1%)
     */
    function addBuyer(
        uint256 _propertyId,
        address payable _buyer,
        uint256 _sharePercentage
    ) public {
        Property storage property = properties[_propertyId];
        require(property.status == PropertyStatus.Listed, "Property not listed");
        require(property.buyerCount < 3, "Maximum 3 buyers allowed");
        require(_sharePercentage > 0 && _sharePercentage <= 10000, "Invalid share percentage");
        
        // Calculate total share percentage
        uint256 totalSharePercentage = _sharePercentage;
        for (uint256 i = 0; i < property.buyerCount; i++) {
            totalSharePercentage += property.buyers[i].sharePercentage;
        }
        require(totalSharePercentage <= 10000, "Total share cannot exceed 100%");
        
        // Add new buyer
        property.buyers[property.buyerCount] = Buyer({
            buyerAddress: _buyer,
            sharePercentage: _sharePercentage,
            amountPaid: 0,
            hasPaid: false
        });
        
        property.buyerCount++;
        property.updatedAt = block.timestamp;
        
        // If all buyers are set, change status to under contract
        if (totalSharePercentage == 10000) {
            property.status = PropertyStatus.UnderContract;
            emit PropertyUpdated(_propertyId, property.price, property.status);
        }
        
        emit BuyerAdded(_propertyId, _buyer, _sharePercentage);
    }
    
    /**
     * @dev Function for a buyer to pay for their share of the property
     * @param _propertyId ID of the property to buy
     */
    function buyPropertyShare(uint256 _propertyId) public payable nonReentrant {
        Property storage property = properties[_propertyId];
        require(property.status == PropertyStatus.Listed || property.status == PropertyStatus.UnderContract, 
                "Property not available for purchase");
        
        // Find buyer
        bool isBuyer = false;
        uint256 buyerIndex;
        
        for (uint256 i = 0; i < property.buyerCount; i++) {
            if (property.buyers[i].buyerAddress == msg.sender) {
                isBuyer = true;
                buyerIndex = i;
                break;
            }
        }
        
        require(isBuyer, "Not a buyer for this property");
        require(!property.buyers[buyerIndex].hasPaid, "Already paid");
        
        // Check all royalty holders have approved
        for (uint256 i = 0; i < property.royaltyHolderCount; i++) {
            require(property.royaltyHolders[i].hasApproved, "Not all royalty holders have approved");
        }
        
        // Calculate amount to pay
        uint256 shareAmount = (property.price * property.buyers[buyerIndex].sharePercentage) / 10000;
        uint256 fee = (shareAmount * purchaseFee) / 10000;
        uint256 totalAmount = shareAmount + fee;
        
        require(msg.value >= totalAmount, "Insufficient payment");
        
        // Pay fee to contract owner
        payable(owner()).transfer(fee);
        
        // Distribute royalties
        uint256 totalRoyaltyAmount = 0;
        
        for (uint256 i = 0; i < property.royaltyHolderCount; i++) {
            uint256 royaltyAmount = (shareAmount * property.royaltyHolders[i].percentage) / 10000;
            property.royaltyHolders[i].holderAddress.transfer(royaltyAmount);
            totalRoyaltyAmount += royaltyAmount;
            
            // Record royalty payment transaction
            _recordTransaction(
                _propertyId,
                msg.sender,
                property.royaltyHolders[i].holderAddress,
                royaltyAmount,
                "RoyaltyPayment"
            );
            
            emit RoyaltyPaid(_propertyId, property.royaltyHolders[i].holderAddress, royaltyAmount);
        }
        
        // Pay owner
        uint256 ownerAmount = shareAmount - totalRoyaltyAmount;
        property.owner.transfer(ownerAmount);
        
        // Update buyer status
        property.buyers[buyerIndex].amountPaid = shareAmount;
        property.buyers[buyerIndex].hasPaid = true;
        
        // Record purchase transaction
        _recordTransaction(
            _propertyId,
            msg.sender,
            property.owner,
            shareAmount,
            "Purchase"
        );
        
        // Check if all buyers have paid
        bool allPaid = true;
        for (uint256 i = 0; i < property.buyerCount; i++) {
            if (!property.buyers[i].hasPaid) {
                allPaid = false;
                break;
            }
        }
        
        // If all buyers have paid, mark property as sold
        if (allPaid && _allSharesPurchased(property)) {
            property.status = PropertyStatus.Sold;
            emit PropertyUpdated(_propertyId, property.price, property.status);
        }
        
        property.updatedAt = block.timestamp;
        
        emit BuyerPaid(_propertyId, msg.sender, shareAmount);
        emit PropertyPurchased(_propertyId, msg.sender, shareAmount);
        
        // Return excess payment
        if (msg.value > totalAmount) {
            payable(msg.sender).transfer(msg.value - totalAmount);
        }
    }
    
    /**
     * @dev Internal function to check if all shares of a property have been purchased
     * @param property Property struct to check
     * @return True if all shares have been purchased
     */
    function _allSharesPurchased(Property storage property) private view returns (bool) {
        uint256 totalSharePercentage = 0;
        
        for (uint256 i = 0; i < property.buyerCount; i++) {
            if (property.buyers[i].hasPaid) {
                totalSharePercentage += property.buyers[i].sharePercentage;
            }
        }
        
        return totalSharePercentage == 10000;
    }
    
    /**
     * @dev Function to cancel a property listing
     * @param _propertyId ID of the property to cancel
     */
    function cancelListing(uint256 _propertyId) public {
        Property storage property = properties[_propertyId];
        require(msg.sender == property.owner || msg.sender == owner(), "Only owner or admin can cancel");
        require(property.status == PropertyStatus.Listed, "Property not in correct state");
        
        // Check if any buyers have already paid
        for (uint256 i = 0; i < property.buyerCount; i++) {
            require(!property.buyers[i].hasPaid, "Cannot cancel: buyers have already paid");
        }
        
        property.status = PropertyStatus.Cancelled;
        property.updatedAt = block.timestamp;
        
        emit PropertyUpdated(_propertyId, property.price, property.status);
    }
    
    /**
     * @dev Internal function to record a transaction
     * @param _propertyId Property ID involved in the transaction
     * @param _from Address of the sender
     * @param _to Address of the receiver
     * @param _amount Amount involved in the transaction
     * @param _type Type of transaction
     */
    function _recordTransaction(
        uint256 _propertyId,
        address _from,
        address _to,
        uint256 _amount,
        string memory _type
    ) private {
        uint256 newTransactionId = ++transactionCount;
        
        transactions[newTransactionId] = Transaction({
            transactionId: newTransactionId,
            propertyId: _propertyId,
            from: _from,
            to: _to,
            amount: _amount,
            timestamp: block.timestamp,
            transactionType: _type
        });
        
        emit TransactionRecorded(newTransactionId, _type);
    }
    
    // --------------- Admin Functions ---------------
    
    /**
     * @dev Function to update the listing fee
     * @param _newListingFee New listing fee in wei
     */
    function updateListingFee(uint256 _newListingFee) public onlyOwner {
        listingFee = _newListingFee;
        emit ListingFeeUpdated(_newListingFee);
    }
    
    /**
     * @dev Function to update the purchase fee
     * @param _newPurchaseFee New purchase fee in basis points
     */
    function updatePurchaseFee(uint256 _newPurchaseFee) public onlyOwner {
        require(_newPurchaseFee <= 1000, "Fee cannot exceed 10%");
        purchaseFee = _newPurchaseFee;
        emit PurchaseFeeUpdated(_newPurchaseFee);
    }
    
    /**
     * @dev Function to withdraw any ERC20 tokens accidentally sent to the contract
     * @param _tokenAddress Address of the ERC20 token
     */
    function withdrawERC20(address _tokenAddress) public onlyOwner {
        IERC20 token = IERC20(_tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        
        token.transfer(owner(), balance);
    }
    
    /**
     * @dev Emergency function to withdraw ETH from the contract
     */
    function withdrawETH() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        
        payable(owner()).transfer(balance);
    }
    
    // --------------- View Functions ---------------
    
   
    function getPropertyDetails(uint256 _propertyId) public view returns (
        uint256 id,
        string memory uri,
        address owner,
        uint256 price,
        PropertyStatus status,
        uint256 royaltyHolderCount,
        uint256 buyerCount,
        uint256 createdAt,
        uint256 updatedAt
    ) {
        Property storage property = properties[_propertyId];
        
        return (
            property.propertyId,
            property.propertyUri,
            property.owner,
            property.price,
            property.status,
            property.royaltyHolderCount,
            property.buyerCount,
            property.createdAt,
            property.updatedAt
        );
    }
    
    
    function getRoyaltyHolderDetails(uint256 _propertyId, uint256 _holderIndex) public view returns (
        address holderAddress,
        uint256 percentage,
        bool hasApproved
    ) {
        Property storage property = properties[_propertyId];
        require(_holderIndex < property.royaltyHolderCount, "Invalid holder index");
        
        RoyaltyHolder storage holder = property.royaltyHolders[_holderIndex];
        
        return (
            holder.holderAddress,
            holder.percentage,
            holder.hasApproved
        );
    }
    
    
    function getBuyerDetails(uint256 _propertyId, uint256 _buyerIndex) public view returns (
        address buyerAddress,
        uint256 sharePercentage,
        uint256 amountPaid,
        bool hasPaid
    ) {
        Property storage property = properties[_propertyId];
        require(_buyerIndex < property.buyerCount, "Invalid buyer index");
        
        Buyer storage buyer = property.buyers[_buyerIndex];
        
        return (
            buyer.buyerAddress,
            buyer.sharePercentage,
            buyer.amountPaid,
            buyer.hasPaid
        );
    }
    
    /**
     * @dev Function to get transactions by property
     * @param _propertyId ID of the property
     * @param _limit Maximum number of transactions to return
     * @param _offset Offset for pagination
     * @return Array of transaction IDs
     */
    function getTransactionsByProperty(
        uint256 _propertyId,
        uint256 _limit,
        uint256 _offset
    ) public view returns (uint256[] memory) {
        // Count transactions for this property
        uint256 count = 0;
        for (uint256 i = 1; i <= transactionCount; i++) {
            if (transactions[i].propertyId == _propertyId) {
                count++;
            }
        }
        
        if (count == 0) {
            return new uint256[](0);
        }
        
        // Apply pagination
        uint256 resultCount = _limit;
        if (resultCount > count - _offset) {
            resultCount = count - _offset > 0 ? count - _offset : 0;
        }
        
        uint256[] memory result = new uint256[](resultCount);
        
        if (resultCount == 0) {
            return result;
        }
        
        // Collect transaction IDs
        uint256 resultIndex = 0;
        uint256 skipped = 0;
        
        for (uint256 i = 1; i <= transactionCount && resultIndex < resultCount; i++) {
            if (transactions[i].propertyId == _propertyId) {
                if (skipped < _offset) {
                    skipped++;
                } else {
                    result[resultIndex] = i;
                    resultIndex++;
                }
            }
        }
        
        return result;
    }
    
    
    function getTransactionDetails(uint256 _transactionId) public view returns (
        uint256 id,
        uint256 propertyId,
        address from,
        address to,
        uint256 amount,
        uint256 timestamp,
        string memory transactionType
    ) {
        Transaction storage txn = transactions[_transactionId];
        require(txn.transactionId == _transactionId, "Transaction does not exist");
        
        return (
            txn.transactionId,
            txn.propertyId,
            txn.from,
            txn.to,
            txn.amount,
            txn.timestamp,
            txn.transactionType
        );
    }
    
    /**
     * @dev Function to get all properties with pagination
     * @param _status Status filter (0 = Listed, 1 = UnderContract, 2 = Sold, 3 = Cancelled)
     * @param _limit Maximum number of properties to return
     * @param _offset Offset for pagination
     * @return Array of property IDs
     */
    function getPropertiesByStatus(
        PropertyStatus _status,
        uint256 _limit,
        uint256 _offset
    ) public view returns (uint256[] memory) {
        // Count properties with this status
        uint256 count = 0;
        for (uint256 i = 1; i <= propertyCount; i++) {
            if (properties[i].status == _status) {
                count++;
            }
        }
        
        if (count == 0) {
            return new uint256[](0);
        }
        
        // Apply pagination
        uint256 resultCount = _limit;
        if (resultCount > count - _offset) {
            resultCount = count - _offset > 0 ? count - _offset : 0;
        }
        
        uint256[] memory result = new uint256[](resultCount);
        
        if (resultCount == 0) {
            return result;
        }
        
        // Collect property IDs
        uint256 resultIndex = 0;
        uint256 skipped = 0;
        
        for (uint256 i = 1; i <= propertyCount && resultIndex < resultCount; i++) {
            if (properties[i].status == _status) {
                if (skipped < _offset) {
                    skipped++;
                } else {
                    result[resultIndex] = i;
                    resultIndex++;
                }
            }
        }
        
        return result;
    }
    
    /**
     * @dev Function to get properties by owner
     * @param _owner Address of the owner
     * @param _limit Maximum number of properties to return
     * @param _offset Offset for pagination
     * @return Array of property IDs
     */
    function getPropertiesByOwner(
        address _owner,
        uint256 _limit,
        uint256 _offset
    ) public view returns (uint256[] memory) {
        // Count properties owned by this address
        uint256 count = 0;
        for (uint256 i = 1; i <= propertyCount; i++) {
            if (properties[i].owner == _owner) {
                count++;
            }
        }
        
        if (count == 0) {
            return new uint256[](0);
        }
        
        // Apply pagination
        uint256 resultCount = _limit;
        if (resultCount > count - _offset) {
            resultCount = count - _offset > 0 ? count - _offset : 0;
        }
        
        uint256[] memory result = new uint256[](resultCount);
        
        if (resultCount == 0) {
            return result;
        }
        
        // Collect property IDs
        uint256 resultIndex = 0;
        uint256 skipped = 0;
        
        for (uint256 i = 1; i <= propertyCount && resultIndex < resultCount; i++) {
            if (properties[i].owner == _owner) {
                if (skipped < _offset) {
                    skipped++;
                } else {
                    result[resultIndex] = i;
                    resultIndex++;
                }
            }
        }
        
        return result;
    }
    
    /**
     * @dev Function to get properties where an address is a buyer
     * @param _buyer Address of the buyer
     * @param _limit Maximum number of properties to return
     * @param _offset Offset for pagination
     * @return Array of property IDs
     */
    function getPropertiesByBuyer(
        address _buyer,
        uint256 _limit,
        uint256 _offset
    ) public view returns (uint256[] memory) {
        // Count properties where this address is a buyer
        uint256 count = 0;
        for (uint256 i = 1; i <= propertyCount; i++) {
            Property storage property = properties[i];
            for (uint256 j = 0; j < property.buyerCount; j++) {
                if (property.buyers[j].buyerAddress == _buyer) {
                    count++;
                    break;
                }
            }
        }
        
        if (count == 0) {
            return new uint256[](0);
        }
        
        // Apply pagination
        uint256 resultCount = _limit;
        if (resultCount > count - _offset) {
            resultCount = count - _offset > 0 ? count - _offset : 0;
        }
        
        uint256[] memory result = new uint256[](resultCount);
        
        if (resultCount == 0) {
            return result;
        }
        
        // Collect property IDs
        uint256 resultIndex = 0;
        uint256 skipped = 0;
        
        for (uint256 i = 1; i <= propertyCount && resultIndex < resultCount; i++) {
            Property storage property = properties[i];
            bool isBuyer = false;
            
            for (uint256 j = 0; j < property.buyerCount; j++) {
                if (property.buyers[j].buyerAddress == _buyer) {
                    isBuyer = true;
                    break;
                }
            }
            
            if (isBuyer) {
                if (skipped < _offset) {
                    skipped++;
                } else {
                    result[resultIndex] = i;
                    resultIndex++;
                }
            }
        }
        
        return result;
    }
    
    /**
     * @dev Function to check if all required approvals are in place for a property
     * @param _propertyId ID of the property
     * @return True if all royalty holders have approved
     */
    function areAllApprovalsInPlace(uint256 _propertyId) public view returns (bool) {
        Property storage property = properties[_propertyId];
        
        for (uint256 i = 0; i < property.royaltyHolderCount; i++) {
            if (!property.royaltyHolders[i].hasApproved) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * @dev Function to get the total number of transactions
     * @return Total number of transactions
     */
    function getTotalTransactions() public view returns (uint256) {
        return transactionCount;
    }
    
    /**
     * @dev Function to get the total number of properties
     * @return Total number of properties
     */
    function getTotalProperties() public view returns (uint256) {
        return propertyCount;
    }
    
  
    function getContractStatistics() public view returns (
        uint256 totalProperties,
        uint256 totalTransactions,
        uint256 listedProperties,
        uint256 soldProperties
    ) {
        uint256 listed = 0;
        uint256 sold = 0;
        
        for (uint256 i = 1; i <= propertyCount; i++) {
            if (properties[i].status == PropertyStatus.Listed) {
                listed++;
            } else if (properties[i].status == PropertyStatus.Sold) {
                sold++;
            }
        }
        
        return (propertyCount, transactionCount, listed, sold);
    }
    
   
    function getSharePaymentDetails(uint256 _propertyId, uint256 _buyerIndex) public view returns (
        uint256 shareAmount,
        uint256 feeAmount,
        uint256 totalAmount
    ) {
        Property storage property = properties[_propertyId];
        require(_buyerIndex < property.buyerCount, "Invalid buyer index");
        
        Buyer storage buyer = property.buyers[_buyerIndex];
        
        shareAmount = (property.price * buyer.sharePercentage) / 10000;
        feeAmount = (shareAmount * purchaseFee) / 10000;
        totalAmount = shareAmount + feeAmount;
        
        return (shareAmount, feeAmount, totalAmount);
    }
    
    /**
     * @dev Function to get the estimated royalty distribution for a property
     * @param _propertyId ID of the property
     * @return Array of royalty amounts
     */
    function getRoyaltyDistribution(uint256 _propertyId) public view returns (uint256[] memory) {
        Property storage property = properties[_propertyId];
        uint256[] memory royaltyAmounts = new uint256[](property.royaltyHolderCount);
        
        for (uint256 i = 0; i < property.royaltyHolderCount; i++) {
            royaltyAmounts[i] = (property.price * property.royaltyHolders[i].percentage) / 10000;
        }
        
        return royaltyAmounts;
    }
}