async function loadRestaurants() {
    const response = await fetch('assets/data/restaurants.json');
    const restaurants = await response.json();
    const restaurantList = document.getElementById('restaurantList');

    restaurants.forEach(restaurant => {
        const listItem = document.createElement('li');
        listItem.textContent = `${restaurant.name} - ${restaurant.cuisine} (${restaurant.rating} stars)`;
        restaurantList.appendChild(listItem);
    });
}

document.addEventListener('DOMContentLoaded', loadRestaurants);
