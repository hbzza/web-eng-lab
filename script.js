
const form = document.getElementById("recipe-form");
const recipeList = document.getElementById("recipe-list");
const searchInput = document.getElementById("search");

let recipes = JSON.parse(
    localStorage.getItem("recipes") || "[]"
);

function saveRecipes() {
    localStorage.setItem("recipes", JSON.stringify(recipes));
}

function renderRecipes() {
    recipeList.replaceChildren();

    const query = searchInput.value.toLowerCase();

    const filtered = recipes.filter(recipe =>
        recipe.title.toLowerCase().includes(query) ||
        recipe.ingredients.toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
        const message = document.createElement("p");
        message.textContent = "No recipes found.";
        recipeList.appendChild(message);
        return;
    }

    filtered.forEach(recipe => {
        const card = document.createElement("article");
        card.className = "recipe-card";

        if (recipe.image) {
            const img = document.createElement("img");
            img.src = recipe.image;
            img.alt = recipe.title;
            card.appendChild(img);
        }

        const heading = document.createElement("h3");
        heading.textContent = recipe.title;
        card.appendChild(heading);

        const viewBtn = document.createElement("button");
        viewBtn.textContent = "View";
        viewBtn.addEventListener("click", () => viewRecipe(recipe.id));

        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", () => editRecipe(recipe.id));

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => deleteRecipe(recipe.id));

        card.append(viewBtn, editBtn, deleteBtn);
        recipeList.appendChild(card);
    });
}

// READ: View one recipe
function viewRecipe(id) {
    const recipe = recipes.find(r => r.id === id);
    if (!recipe) return;

    document.getElementById("dialog-title").textContent = recipe.title;
    document.getElementById("dialog-ingredients").textContent =
        recipe.ingredients;
    document.getElementById("dialog-instructions").textContent =
        recipe.instructions;

    const image = document.getElementById("dialog-image");
    image.hidden = !recipe.image;

    if (recipe.image) {
        image.src = recipe.image;
    } else {
        image.removeAttribute("src");
    }

    document.getElementById("recipe-dialog").showModal();
}

// CREATE and UPDATE
form.addEventListener("submit", async event => {
    event.preventDefault();

    const id = document.getElementById("recipe-id").value;
    const title = document.getElementById("title").value.trim();
    const ingredients = document.getElementById("ingredients").value.trim();
    const instructions = document.getElementById("instructions").value.trim();
    const file = document.getElementById("image").files[0];

    if (!title || !ingredients || !instructions) {
        alert("Please fill in all required fields.");
        return;
    }

    if (file && !file.type.startsWith("image/")) {
        alert("Please select a valid image file.");
        return;
    }

    if (file && file.size > 1024 * 1024) {
        alert("Please choose an image smaller than 1 MB.");
        return;
    }

    const existing = recipes.find(r => r.id === id);

    let image = existing ? existing.image : "";

    if (file) {
        image = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        }).catch(() => null);

        if (image === null) {
            alert("Could not read the image. Please try again.");
            return;
        }
    }

    const recipe = {
        id: id || String(Date.now()) + Math.random(),
        title,
        ingredients,
        instructions,
        image
    };

    if (id) {
        const index = recipes.findIndex(r => r.id === id);

        if (index === -1) {
            alert("Recipe not found.");
            return;
        }

        recipes[index] = recipe;
    } else {
        recipes.push(recipe);
    }

    try {
        saveRecipes();
    } catch (error) {
        alert("Storage is full. Try using a smaller image.");
        recipes = JSON.parse(
            localStorage.getItem("recipes") || "[]"
        );
        renderRecipes();
        return;
    }

    form.reset();
    document.getElementById("recipe-id").value = "";
    document.getElementById("form-heading").textContent = "Add a New Recipe";
    document.getElementById("submit-btn").textContent = "Add Recipe";
    document.getElementById("cancel-btn").hidden = true;

    renderRecipes();
});

// UPDATE: Load recipe data into the form
function editRecipe(id) {
    const recipe = recipes.find(r => r.id === id);
    if (!recipe) return;

    document.getElementById("recipe-id").value = recipe.id;
    document.getElementById("title").value = recipe.title;
    document.getElementById("ingredients").value = recipe.ingredients;
    document.getElementById("instructions").value = recipe.instructions;

    document.getElementById("form-heading").textContent = "Edit Recipe";
    document.getElementById("submit-btn").textContent = "Update Recipe";
    document.getElementById("cancel-btn").hidden = false;

    document.getElementById("title").focus();
}

// DELETE
function deleteRecipe(id) {
    const confirmed = confirm("Are you sure you want to delete this recipe?");
    if (!confirmed) return;

    recipes = recipes.filter(recipe => recipe.id !== id);
    saveRecipes();
    renderRecipes();
}

document.getElementById("cancel-btn").addEventListener("click", () => {
    form.reset();
    document.getElementById("recipe-id").value = "";
    document.getElementById("form-heading").textContent = "Add a New Recipe";
    document.getElementById("submit-btn").textContent = "Add Recipe";
    document.getElementById("cancel-btn").hidden = true;
});

document.getElementById("close-dialog").addEventListener("click", () => {
    document.getElementById("recipe-dialog").close();
});

searchInput.addEventListener("input", renderRecipes);

renderRecipes();
